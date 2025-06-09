// backend/server.js - UPDATED dengan Order Routes
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import connection function
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./route/authRoutes');
const userRoutes = require('./route/userRoutes');
const productRoutes = require('./route/productRoutes');
const adminRoutes = require('./route/adminRoutes');
const wishlistRoutes = require('./route/wishlistRoutes');
const cartRoutes = require('./route/cartRoutes');
const paymentRoutes = require('./route/paymentRoutes');

// Import order routes with error handling
let orderRoutes;
try {
  orderRoutes = require('./route/orderRoutes');
  console.log('✅ Order routes imported successfully');
} catch (err) {
  console.error('❌ Failed to import order routes:', err.message);
  // Create fallback router
  orderRoutes = express.Router();
  orderRoutes.use('*', (req, res) => {
    res.status(500).json({
      success: false,
      message: 'Order routes not available',
      error: 'Order controller not properly configured'
    });
  });
}

const app = express();

// Allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://zerowaste-frontend-eosin.vercel.app',
  'https://zerowaste-backend-theta.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.match(/^http:\/\/localhost:\d+$/)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database connection for serverless
let isConnected = false;

const initializeDB = async () => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      console.log('✅ Database initialized for serverless');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  try {
    await initializeDB();
    next();
  } catch (error) {
    console.error('❌ Database middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState;

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      mongodb: {
        connected: dbStatus === 1,
        readyState: dbStatus
      },
      features: {
        orders: !!orderRoutes,
        payments: !!paymentRoutes,
        products: !!productRoutes
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ZeroWasteMarket API - Backend Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    status: 'running',
    features: [
      'Authentication',
      'User Management',
      'Product Management',
      'Order History',
      'Payment Integration',
      'Admin Panel',
      'Wishlist',
      'Shopping Cart'
    ]
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/orders', orderRoutes); // NEW: Order routes

// Static files serving (simplified for Vercel)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API endpoint listing
app.get('/api', (req, res) => {
  res.json({
    message: 'ZeroWasteMarket API Endpoints',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders',
      payment: '/api/payment',
      admin: '/api/admin',
      wishlist: '/api/wishlist',
      cart: '/api/cart'
    },
    documentation: 'Contact admin for API documentation'
  });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      '/api/auth',
      '/api/users',
      '/api/products',
      '/api/orders',
      '/api/payment',
      '/api/admin',
      '/api/wishlist',
      '/api/cart'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err.message);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: err.message
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Export for Vercel
module.exports = app;

// Start server only if not in Vercel
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
    console.log(`   - Users: http://localhost:${PORT}/api/users`);
    console.log(`   - Products: http://localhost:${PORT}/api/products`);
    console.log(`   - Orders: http://localhost:${PORT}/api/orders`);
    console.log(`   - Payment: http://localhost:${PORT}/api/payment`);
    console.log(`   - Admin: http://localhost:${PORT}/api/admin`);
    console.log(`   - Wishlist: http://localhost:${PORT}/api/wishlist`);
    console.log(`   - Cart: http://localhost:${PORT}/api/cart`);
    await initializeDB();
  });
}