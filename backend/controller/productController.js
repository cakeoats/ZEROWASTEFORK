// backend/controller/productController.js
const Product = require('../models/product');
const User = require('../models/User');
const path = require('path');

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

    // Ambil file path dari req.files
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

    res.status(201).json({ message: 'Product uploaded successfully', product: newProduct });
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

module.exports = {
  uploadProduct,
  getProductDetail,
};
