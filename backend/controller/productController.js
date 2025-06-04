// backend/controller/productController.js - SUPABASE VERSION
const Product = require('../models/product');
const User = require('../models/User');
const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// Upload product dengan Supabase Storage
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

    // Validasi minimal field yang wajib
    if (!name || !price || !category || !condition || !tipe) {
      console.log('❌ Validation failed: missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Field wajib harus diisi',
        missing: {
          name: !name,
          price: !price,
          category: !category,
          condition: !condition,
          tipe: !tipe
        }
      });
    }

    // Validasi gambar
    if (!req.files || req.files.length === 0) {
      console.log('❌ Validation failed: no images uploaded');
      return res.status(400).json({
        success: false,
        message: 'Minimal 1 gambar harus diupload'
      });
    }

    console.log('🔄 Starting image upload to Supabase...');

    // Upload images to Supabase Storage
    const imageUrls = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      try {
        // Generate unique filename
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${uuidv4()}.${fileExt}`;

        console.log(`📤 Uploading image ${i + 1}/${req.files.length} to Supabase:`, fileName);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('product-images') // Bucket name
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('❌ Supabase upload error:', error);
          throw new Error(`Supabase upload failed: ${error.message}`);
        }

        console.log('✅ File uploaded to Supabase:', data);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;
        console.log('🔗 Public URL generated:', publicUrl);

        imageUrls.push(publicUrl);

      } catch (uploadError) {
        console.error('❌ Error uploading image:', uploadError);

        // Clean up any successfully uploaded images
        for (const url of imageUrls) {
          try {
            const path = url.split('/product-images/')[1];
            await supabase.storage.from('product-images').remove([path]);
          } catch (cleanupError) {
            console.error('❌ Cleanup error:', cleanupError);
          }
        }

        return res.status(500).json({
          success: false,
          message: 'Gagal upload gambar: ' + uploadError.message
        });
      }
    }

    console.log('✅ All images uploaded successfully:', imageUrls);

    // Create new product with Supabase URLs
    const newProduct = new Product({
      seller_id: userId,
      name,
      description,
      price: parseFloat(price),
      category,
      images: imageUrls, // Array of Supabase URLs
      stock: parseInt(stock) || 1,
      condition,
      tipe,
    });

    console.log('💾 Saving product to database...');
    await newProduct.save();
    console.log('✅ Product saved with ID:', newProduct._id);

    // Return product with image URLs
    const productObj = newProduct.toObject();
    productObj.imageUrls = imageUrls;
    productObj.imageUrl = imageUrls[0]; // First image as main

    res.status(201).json({
      success: true,
      message: 'Product uploaded successfully',
      product: productObj
    });

  } catch (error) {
    console.error('💥 Upload product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload product',
      error: error.message
    });
  }
};

// Get product detail - tetap sama tapi return image URLs as is
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

    // Dengan Supabase, images sudah berupa full URLs
    if (product.images && product.images.length > 0) {
      product.imageUrls = product.images; // Images are already full URLs
      product.imageUrl = product.images[0]; // First image as main
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

// Get all products - tetap sama tapi return image URLs as is
const getAllProducts = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    console.log('📋 Fetching products with filters:', { category, search, sort });

    // Buat filter berdasarkan query parameters
    let filter = {};

    if (category && category !== 'All') {
      filter.category = { $regex: new RegExp(category, 'i') };
    }

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

    const products = await Product.find(filter)
      .sort(sortOption)
      .populate('seller_id', 'username full_name')
      .lean();

    console.log('📦 Found', products.length, 'products');

    // Process each product - dengan Supabase, images sudah berupa URLs
    const productsWithImageUrls = products.map(product => {
      if (product.images && product.images.length > 0) {
        product.imageUrls = product.images; // Already full URLs
        product.imageUrl = product.images[0]; // First image as main
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

// Update product function (untuk edit product)
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

    // Delete specified images from Supabase
    if (imagesToDelete) {
      let imagesToDeleteArray;
      try {
        imagesToDeleteArray = typeof imagesToDelete === 'string'
          ? JSON.parse(imagesToDelete)
          : imagesToDelete;

        console.log('🗑️ Images to delete:', imagesToDeleteArray);

        // Remove from Supabase Storage
        for (const imageUrl of imagesToDeleteArray) {
          try {
            const path = imageUrl.split('/product-images/')[1];
            if (path) {
              await supabase.storage.from('product-images').remove([path]);
              console.log('✅ Deleted from Supabase:', path);
            }
          } catch (err) {
            console.error('❌ Error deleting from Supabase:', err);
          }
        }

        // Remove from array
        updatedImages = updatedImages.filter(img => !imagesToDeleteArray.includes(img));
      } catch (err) {
        console.error('❌ Error parsing imagesToDelete:', err);
      }
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      console.log('➕ Adding new images:', req.files.length);

      for (const file of req.files) {
        try {
          const fileExt = file.originalname.split('.').pop();
          const fileName = `${userId}/${Date.now()}-${uuidv4()}.${fileExt}`;

          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(fileName, file.buffer, {
              contentType: file.mimetype,
              cacheControl: '3600',
              upsert: false
            });

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

          updatedImages.push(urlData.publicUrl);
          console.log('✅ New image added:', urlData.publicUrl);
        } catch (uploadError) {
          console.error('❌ Error uploading new image:', uploadError);
        }
      }
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
      updatedProduct.imageUrls = updatedProduct.images;
      updatedProduct.imageUrl = updatedProduct.images[0];
    }

    console.log('✅ Product updated successfully');
    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('💥 Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// Delete product function
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

    // Delete associated images from Supabase
    if (product.images && product.images.length > 0) {
      console.log('🗑️ Deleting', product.images.length, 'images from Supabase');

      for (const imageUrl of product.images) {
        try {
          const path = imageUrl.split('/product-images/')[1];
          if (path) {
            await supabase.storage.from('product-images').remove([path]);
            console.log(`✅ Deleted image: ${path}`);
          }
        } catch (err) {
          console.error('❌ Error deleting image from Supabase:', err);
        }
      }
    }

    // Delete the product from database
    await Product.findByIdAndDelete(id);

    console.log('✅ Product deleted successfully');
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('💥 Delete product error:', error);
    res.status(500).json({
      success: false,
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