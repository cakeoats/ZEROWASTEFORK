const Admin = require('../models/admin');
const Product = require('../models/product');
const User = require('../models/User');
const Notification = require('../models/notification'); // Anda perlu membuat model ini
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    console.log('Login attempt for username:', username);
    
    const admin = await Admin.findOne({ username });
    
    if (!admin) {
      console.log('Admin not found');
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
    
    console.log('Admin found:', admin.username);
    
    const isMatch = await bcrypt.compare(password, admin.password);
    
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: 'admin' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    res.json({ 
      success: true, 
      message: 'Login successful', 
      adminId: admin._id,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all products for admin
exports.getProducts = async (req, res) => {
  try {
    // Get query parameters
    const { sort, category, search, limit } = req.query;
    
    // Create filter object
    let filter = {};
    
    // Add category filter if provided
    if (category) {
      filter.category = { $regex: new RegExp(category, 'i') };
    }
    
    // Add search filter if provided
    if (search) {
      filter.$or = [
        { name: { $regex: new RegExp(search, 'i') } },
        { description: { $regex: new RegExp(search, 'i') } }
      ];
    }
    
    // Create sort options
    let sortOptions = { createdAt: -1 }; // Default: newest first
    
    if (sort === 'price-asc') {
      sortOptions = { price: 1 };
    } else if (sort === 'price-desc') {
      sortOptions = { price: -1 };
    }
    
    // Get products with pagination
    const products = await Product.find(filter)
      .sort(sortOptions)
      .populate('seller_id', 'username full_name email')
      .lean();
    
    // Get recent products (limited to 5 or specified limit)
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 5)
      .populate('seller_id', 'username full_name')
      .lean();
    
    // Get total products count
    const totalProducts = await Product.countDocuments();
    
    // Prepare response
    res.json({
      success: true,
      totalProducts,
      products,
      recentProducts
    });
    
  } catch (error) {
    console.error('Admin get products error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete product by ID
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Alasan penghapusan harus disediakan' });
    }
    
    // Find the product to get seller info
    const product = await Product.findById(id).populate('seller_id');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }
    
    // Delete product
    await Product.findByIdAndDelete(id);
    
    // Create notification for the seller
    if (product.seller_id) {
      const newNotification = new Notification({
        user: product.seller_id._id,
        type: 'product_deleted',
        title: 'Produk Dihapus',
        message: `Produk Anda "${product.name}" telah dihapus oleh admin karena: ${reason}`,
        data: {
          productId: product._id,
          productName: product.name,
          reason: reason
        },
        read: false
      });
      
      await newNotification.save();
    }
    
    res.json({
      success: true,
      message: 'Produk berhasil dihapus dan notifikasi telah dikirim ke pemilik'
    });
    
  } catch (error) {
    console.error('Admin delete product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get total users count
exports.getUsersCount = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    
    res.json({
      success: true,
      totalUsers
    });
  } catch (error) {
    console.error('Admin get users count error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};