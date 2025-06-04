const Product = require('../models/product');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// IMPROVED: Base URL untuk akses gambar dengan fallback yang lebih baik
const BASE_URL = process.env.BASE_URL || process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'https://zerowaste-backend-theta.vercel.app';

console.log('🔗 Using BASE_URL for images:', BASE_URL);

// IMPROVED: Upload product dengan image handling yang lebih baik
const uploadProduct = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('📤 Upload request from user:', userId);

    // Ambil data form
    const {
      name,
      description,
      price,
      category,
      stock,
      condition,
      tipe,
    } = req.body;

    console.log('📋 Product data:', { name, price, category, condition, tipe });
    console.log('📁 Uploaded files:', req.files?.length || 0, 'files');

    // IMPROVED: Process uploaded images dengan path yang konsisten
    const images = req.files ? req.files.map(file => {
      // Simpan path relatif tanpa leading slash untuk konsistensi
      const relativePath = `uploads/${file.filename}`;
      console.log('💾 Saving image path:', relativePath);
      console.log('📂 File details:', {
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype
      });
      return relativePath;
    }) : [];

    // Validasi minimal field yang wajib
    if (!name || !price || !category || !condition || !tipe) {
      console.log('❌ Validation failed: missing required fields');
      return res.status(400).json({
        message: 'Missing required fields',
        missing: {
          name: !name,
          price: !price,
          category: !category,
          condition: !condition,
          tipe: !tipe
        }
      });
    }

    if (images.length === 0) {
      console.log('❌ Validation failed: no images uploaded');
      return res.status(400).json({
        message: 'At least one image is required'
      });
    }

    // Create new product
    const newProduct = new Product({
      seller_id: userId,
      name,
      description,
      price: parseFloat(price),
      category,
      images,
      stock: parseInt(stock) || 1,
      condition,
      tipe,
    });

    console.log('💾 Saving product to database...');
    await newProduct.save();
    console.log('✅ Product saved with ID:', newProduct._id);

    // IMPROVED: Return product dengan imageUrls yang sudah di-construct
    const productObj = newProduct.toObject();

    // Construct full image URLs untuk response
    productObj.imageUrls = productObj.images.map(img => {
      const fullUrl = `${BASE_URL}/${img}`;
      console.log('🔗 Generated image URL:', fullUrl);
      return fullUrl;
    });

    // Add first image as imageUrl for backward compatibility
    if (productObj.imageUrls.length > 0) {
      productObj.imageUrl = productObj.imageUrls[0];
    }

    console.log('✅ Product upload successful');
    res.status(201).json({
      message: 'Product uploaded successfully',
      product: productObj
    });
  } catch (error) {
    console.error('💥 Upload product error:', error);
    res.status(500).json({
      message: 'Failed to upload product',
      error: error.message
    });
  }
};

// IMPROVED: Get product detail dengan image URLs yang konsisten
const getProductDetail = async (req, res) => {
  try {
    const productId = req.params.id;
    console.log('🔍 Fetching product detail for ID:', productId);

    const product = await Product.findById(productId)
      .populate('seller_id', 'username full_name phone email')
      .lean();

    if (!product) {
      console.log('❌ Product not found:', productId);
      return res.status(404).json({ message: 'Product not found' });
    }

    // IMPROVED: Add full image URLs to response
    if (product.images && product.images.length > 0) {
      product.imageUrls = product.images.map(img => `${BASE_URL}/${img}`);
      product.imageUrl = product.imageUrls[0]; // First image as main
    } else {
      product.imageUrls = [];
      product.imageUrl = null;
    }

    console.log('✅ Product detail fetched successfully');
    res.json(product);
  } catch (err) {
    console.error('💥 Error fetching product detail:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// IMPROVED: Get all products dengan image URLs yang konsisten
const getAllProducts = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    console.log('📋 Fetching products with filters:', { category, search, sort });

    // Buat filter berdasarkan query parameters
    let filter = {};

    // Filter berdasarkan kategori jika ada
    if (category && category !== 'All') {
      filter.category = { $regex: new RegExp(category, 'i') };
    }

    // Filter berdasarkan pencarian jika ada
    if (search) {
      filter.name = { $regex: new RegExp(search, 'i') };
    }

    // Buat sort options
    let sortOption = {};
    if (sort === 'price-asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price-desc') {
      sortOption = { price: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    // Ambil produk dari database
    const products = await Product.find(filter)
      .sort(sortOption)
      .populate('seller_id', 'username full_name')
      .lean();

    console.log('📦 Found', products.length, 'products');

    // IMPROVED: Process each product to add image URLs
    const productsWithImageUrls = products.map(product => {
      if (product.images && product.images.length > 0) {
        // Add full URLs for all images
        product.imageUrls = product.images.map(img => `${BASE_URL}/${img}`);
        // Set first image as main imageUrl for backward compatibility
        product.imageUrl = product.imageUrls[0];
      } else {
        product.imageUrls = [];
        product.imageUrl = null;
      }

      return product;
    });

    console.log('✅ Products processed with image URLs');
    res.json(productsWithImageUrls);
  } catch (error) {
    console.error('💥 Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// IMPROVED: Update product dengan image handling yang lebih baik
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    console.log(`🔄 Updating product ${id} for user ${userId}`);

    // Find the product
    const product = await Product.findById(id);

    if (!product) {
      console.log('❌ Product not found:', id);
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check ownership
    const isOwner = product.seller_id.toString() === userId.toString();
    console.log(`🔐 Ownership check: ${isOwner ? 'Valid' : 'Invalid'}`);

    if (!isOwner) {
      return res.status(403).json({
        message: 'You do not have permission to update this product'
      });
    }

    // Get form data
    const {
      name, description, price, category, stock, condition, tipe, imagesToDelete
    } = req.body;

    console.log('📝 Update data received:', {
      name, price, category, condition, tipe,
      imagesToDeleteCount: imagesToDelete ?
        (typeof imagesToDelete === 'string' ? JSON.parse(imagesToDelete).length : imagesToDelete.length)
        : 0,
      newImagesCount: req.files?.length || 0,
    });

    // Update basic fields
    const updateData = {
      name: name || product.name,
      description: description || product.description,
      price: price ? parseFloat(price) : product.price,
      category: category || product.category,
      stock: stock ? parseInt(stock) : product.stock,
      condition: condition || product.condition,
      tipe: tipe || product.tipe
    };

    // Handle image updates
    let updatedImages = [...product.images];

    // Delete specified images
    if (imagesToDelete) {
      let imagesToDeleteArray;
      try {
        imagesToDeleteArray = typeof imagesToDelete === 'string'
          ? JSON.parse(imagesToDelete)
          : imagesToDelete;

        console.log('🗑️ Images to delete:', imagesToDeleteArray);

        // Remove from array
        updatedImages = updatedImages.filter(img => !imagesToDeleteArray.includes(img));

        // Delete actual files
        imagesToDeleteArray.forEach(imgPath => {
          try {
            const fullPath = path.join(__dirname, '..', imgPath);
            console.log('🗑️ Deleting file:', fullPath);

            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              console.log('✅ File deleted successfully');
            } else {
              console.log('⚠️ File does not exist, skipping');
            }
          } catch (err) {
            console.error('❌ Error deleting file:', err);
          }
        });
      } catch (err) {
        console.error('❌ Error parsing imagesToDelete:', err);
      }
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `uploads/${file.filename}`);
      console.log('➕ New images to add:', newImages);
      updatedImages = [...updatedImages, ...newImages];
    }

    updateData.images = updatedImages;

    console.log('💾 Final update data:', {
      ...updateData,
      imageCount: updateData.images.length
    });

    // Update in database
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true })
      .populate('seller_id', 'username full_name phone')
      .lean();

    // Add image URLs to response
    if (updatedProduct.images && updatedProduct.images.length > 0) {
      updatedProduct.imageUrls = updatedProduct.images.map(img => `${BASE_URL}/${img}`);
      updatedProduct.imageUrl = updatedProduct.imageUrls[0];
    }

    console.log('✅ Product updated successfully');
    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('💥 Update product error:', error);
    res.status(500).json({
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// IMPROVED: Delete product dengan cleanup file yang lebih baik
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    console.log(`🗑️ Deleting product ${id} for user ${userId}`);

    // Find the product
    const product = await Product.findById(id);

    if (!product) {
      console.log('❌ Product not found:', id);
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check ownership
    if (product.seller_id.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'You do not have permission to delete this product'
      });
    }

    // Delete associated image files
    if (product.images && product.images.length > 0) {
      console.log('🗑️ Deleting', product.images.length, 'image files');

      product.images.forEach(imgPath => {
        try {
          const fullPath = path.join(__dirname, '..', imgPath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`✅ Deleted image: ${imgPath}`);
          }
        } catch (err) {
          console.error('❌ Error deleting image file:', err);
        }
      });
    }

    // Delete the product from database
    await Product.findByIdAndDelete(id);

    console.log('✅ Product deleted successfully');
    res.json({
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('💥 Delete product error:', error);
    res.status(500).json({
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

module.exports = {
  uploadProduct,
  getProductDetail,
  getAllProducts,
  updateProduct,
  deleteProduct
};