// backend/server.js - FIXED CORS Configuration
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

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

// FIXED: Enhanced CORS configuration with proper domain handling
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://zerowaste-frontend-eosin.vercel.app',
  'https://zerowaste-backend-theta.vercel.app',
  'https://zerowastermarket.web.id',
  'https://www.zerowastermarket.web.id',
  'https://zerowastermarket.web.id/',
  'https://www.zerowastermarket.web.id/',
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log('🔧 Allowed CORS origins:', allowedOrigins);

// FIXED: More permissive CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    console.log('🌐 CORS request from origin:', origin);
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) {
      console.log('✅ Allowing request with no origin');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin allowed:', origin);
      return callback(null, true);
    }
    
    // Check for localhost with any port
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      console.log('✅ Localhost origin allowed:', origin);
      return callback(null, true);
    }
    
    // Check for zerowastermarket.web.id variations
    if (origin.includes('zerowastermarket.web.id')) {
      console.log('✅ ZeroWasterMarket domain allowed:', origin);
      return callback(null, true);
    }
    
    // For development, be more permissive
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Development mode - allowing origin:', origin);
      return callback(null, true);
    }
    
    console.log('❌ Origin not allowed:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin', 
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200 // For legacy browser support
}));

// FIXED: Add preflight OPTIONS handler
app.options('*', (req, res) => {
  console.log('🔧 Handling OPTIONS preflight for:', req.path);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// FIXED: Request logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path} from ${req.headers.origin || 'unknown origin'}`);
  next();
});

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

// FIXED: Enhanced health check endpoint
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
      cors: {
        allowedOrigins: allowedOrigins,
        currentOrigin: req.headers.origin
      },
      features: {
        orders: !!orderRoutes,
        payments: !!paymentRoutes,
        products: !!productRoutes,
        wishlist: !!wishlistRoutes
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
    origin: req.headers.origin,
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

// API Routes with enhanced error handling
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/orders', orderRoutes);

// Static files serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API endpoint listing
app.get('/api', (req, res) => {
  res.json({
    message: 'ZeroWasteMarket API Endpoints',
    version: '1.0.0',
    origin: req.headers.origin,
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

// FIXED: Enhanced 404 handler with CORS headers
app.use('/api/*', (req, res) => {
  // Ensure CORS headers are set for 404 responses
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
    method: req.method,
    origin: req.headers.origin,
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

// FIXED: Global error handler with CORS headers
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err.message);
  console.error('🔍 Error details:', {
    path: req.path,
    method: req.method,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']
  });

  // Ensure CORS headers are set for error responses
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');

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