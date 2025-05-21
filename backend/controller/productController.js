const Product = require('../models/product');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Base URL untuk akses gambar
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Upload product
const uploadProduct = async (req, res) => {
  try {
    const userId = req.user._id;

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

    // Ambil file path dari req.files dan format menjadi URL lengkap
    const images = req.files.map(file => path.join('uploads', file.filename));

    // Validasi minimal field yang wajib
    if (!name || !price || !category || !condition || !tipe) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newProduct = new Product({
      seller_id: userId,
      name,
      description,
      price,
      category,
      images,
      stock,
      condition,
      tipe,
    });

    await newProduct.save();

    // Convert ke object untuk mengakses virtual properties
    const productObj = newProduct.toObject();

    res.status(201).json({
      message: 'Product uploaded successfully',
      product: {
        ...productObj,
        imageUrls: productObj.imageUrls // Virtual property dari model
      }
    });
  } catch (error) {
    console.error('Upload product error:', error);
    res.status(500).json({ message: 'Failed to upload product', error: error.message });
  }
};

// Ambil detail produk
const getProductDetail = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller_id', 'username full_name phone');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json(product);
  } catch (err) {
    console.error('Error fetching product detail:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Ambil semua produk (dengan filter opsional)
const getAllProducts = async (req, res) => {
  try {
    const { category, search, sort } = req.query;

    // Buat filter berdasarkan query parameters
    let filter = {};

    // Filter berdasarkan kategori jika ada
    if (category && category !== 'All') {
      // Gunakan regex untuk case insensitive
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
      // Default sort berdasarkan tanggal terbaru
      sortOption = { createdAt: -1 };
    }

    // Ambil produk dari database
    const products = await Product.find(filter)
      .sort(sortOption)
      .populate('seller_id', 'username full_name')
      .lean();

    // Tambahkan imageUrl lengkap untuk setiap produk
    const productsWithImageUrls = products.map(product => {
      const firstImage = product.images && product.images.length > 0
        ? `${BASE_URL}/${product.images[0]}`
        : null;

      return {
        ...product,
        imageUrl: firstImage
      };
    });

    res.json(productsWithImageUrls);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    console.log(`Updating product ${id} for user ${userId}`);

    // Find the product
    const product = await Product.findById(id);

    // Check if product exists
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Found product:', {
      id: product._id,
      name: product.name,
      sellerId: product.seller_id
    });

    // Check if user is the owner of the product
    const isOwner = product.seller_id.toString() === userId.toString();
    console.log(`Ownership check: User ${userId} is${isOwner ? '' : ' not'} the owner of product ${id}`);

    if (!isOwner) {
      return res.status(403).json({ message: 'You do not have permission to update this product' });
    }

    // Get form data
    const {
      name,
      description,
      price,
      category,
      stock,
      condition,
      tipe,
      imagesToDelete // Array of image paths to delete
    } = req.body;

    console.log('Received update data:', {
      name,
      price,
      category,
      condition,
      tipe,
      imagesToDeleteCount: imagesToDelete ? 
        (typeof imagesToDelete === 'string' ? JSON.parse(imagesToDelete).length : imagesToDelete.length) 
        : 0,
      newImagesCount: req.files?.length || 0,
    });

    // Update fields
    const updateData = {
      name: name || product.name,
      description: description || product.description,
      price: price || product.price,
      category: category || product.category,
      stock: stock || product.stock,
      condition: condition || product.condition,
      tipe: tipe || product.tipe
    };

    // Handle image deletion if necessary
    let updatedImages = [...product.images];

    if (imagesToDelete) {
      // Parse JSON string if needed
      let imagesToDeleteArray;
      try {
        imagesToDeleteArray = typeof imagesToDelete === 'string'
          ? JSON.parse(imagesToDelete)
          : imagesToDelete;
        
        console.log('Images to delete:', imagesToDeleteArray);

        // Remove images from the array
        updatedImages = updatedImages.filter(img => !imagesToDeleteArray.includes(img));

        // Delete actual files
        imagesToDeleteArray.forEach(imgPath => {
          try {
            const fullPath = path.join(__dirname, '..', imgPath);
            console.log('Attempting to delete file at path:', fullPath);
            
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              console.log('Successfully deleted file');
            } else {
              console.log('File does not exist, skipping delete');
            }
          } catch (err) {
            console.error('Error deleting image file:', err);
          }
        });
      } catch (err) {
        console.error('Error parsing imagesToDelete:', err);
      }
    }

    // Add new images if any
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => path.join('uploads', file.filename));
      console.log('New images to add:', newImages);
      updatedImages = [...updatedImages, ...newImages];
    }

    // Update the image field
    updateData.images = updatedImages;

    console.log('Final update data:', {
      ...updateData,
      imageCount: updateData.images.length
    });

    // Update the product in the database
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // Return the updated document
    );

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product', error: error.message });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the product
    const product = await Product.findById(id);

    // Check if product exists
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the owner of the product
    if (product.seller_id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You do not have permission to delete this product' });
    }

    // Delete associated image files
    if (product.images && product.images.length > 0) {
      product.images.forEach(imgPath => {
        try {
          const fullPath = path.join(__dirname, '..', imgPath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`Deleted image: ${fullPath}`);
          }
        } catch (err) {
          console.error('Error deleting image file:', err);
        }
      });
    }

    // Delete the product from database
    await Product.findByIdAndDelete(id);

    res.json({
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product', error: error.message });
  }
};

module.exports = {
  uploadProduct,
  getProductDetail,
  getAllProducts,
  updateProduct,
  deleteProduct
};