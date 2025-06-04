// backend/controller/productController.js - SIMPLIFIED VERSION
const Product = require('../models/product');

// Simplified upload function for testing
const uploadProduct = async (req, res) => {
  try {
    console.log('📤 Upload request received');
    console.log('User:', req.user ? req.user._id : 'No user');
    console.log('Body:', req.body);
    console.log('Files:', req.files ? req.files.length : 'No files');

    const userId = req.user._id;
    const { name, description, price, category, stock, condition, tipe } = req.body;

    // Basic validation
    if (!name || !price || !category || !condition || !tipe) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        received: { name, price, category, condition, tipe }
      });
    }

    // For now, just return success without Supabase upload
    // This will help us test if the basic flow works
    const tempImageUrls = ['https://via.placeholder.com/300x300?text=Test+Image'];

    const newProduct = new Product({
      seller_id: userId,
      name,
      description,
      price: parseFloat(price),
      category,
      images: tempImageUrls, // Temporary placeholder
      stock: parseInt(stock) || 1,
      condition,
      tipe,
    });

    await newProduct.save();
    console.log('✅ Product saved with ID:', newProduct._id);

    res.status(201).json({
      success: true,
      message: 'Product uploaded successfully (test mode)',
      product: {
        ...newProduct.toObject(),
        imageUrls: tempImageUrls,
        imageUrl: tempImageUrls[0]
      }
    });

  } catch (error) {
    console.error('💥 Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload product',
      error: error.message
    });
  }
};

const getProductDetail = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId)
      .populate('seller_id', 'username full_name phone email')
      .lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.images && product.images.length > 0) {
      product.imageUrls = product.images;
      product.imageUrl = product.images[0];
    }

    res.json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let filter = {};

    if (category && category !== 'All') {
      filter.category = { $regex: new RegExp(category, 'i') };
    }

    if (search) {
      filter.name = { $regex: new RegExp(search, 'i') };
    }

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

    const productsWithImageUrls = products.map(product => {
      if (product.images && product.images.length > 0) {
        product.imageUrls = product.images;
        product.imageUrl = product.images[0];
      }
      return product;
    });

    res.json(productsWithImageUrls);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProduct = async (req, res) => {
  res.status(501).json({ message: 'Update function not implemented yet' });
};

const deleteProduct = async (req, res) => {
  res.status(501).json({ message: 'Delete function not implemented yet' });
};

module.exports = {
  uploadProduct,
  getProductDetail,
  getAllProducts,
  updateProduct,
  deleteProduct
};