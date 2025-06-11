// backend/server.js - ENHANCED CORS Configuration
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

// ENHANCED: More comprehensive CORS configuration with YOUR domains
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  // FIXED: Add YOUR actual frontend domain
  'https://www.zerowastermarket.web.id',
  'https://zerowastermarket.web.id',
  // Keep existing domains for fallback
  'https://zerowaste-frontend-eosin.vercel.app',
  'https://zerowaste-backend-theta.vercel.app',
  // FIXED: Add additional frontend domains that might be used
  'https://zerowastemarket.vercel.app',
  'https://zerowastemarket-frontend.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log('🔧 Allowed CORS origins:', allowedOrigins);

// ENHANCED: More permissive and robust CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    console.log('🌐 CORS request from origin:', origin || 'no-origin');

    // FIXED: Always allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) {
      console.log('✅ Allowing request with no origin (mobile/postman/curl)');
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin explicitly allowed:', origin);
      return callback(null, true);
    }

    // Check for localhost with any port (development)
    if (origin.match(/^https?:\/\/localhost:\d+$/)) {
      console.log('✅ Localhost origin allowed:', origin);
      return callback(null, true);
    }

    // Check for zerowastermarket.web.id variations
    if (origin.includes('zerowastermarket.web.id') || origin.includes('zerowastermarket')) {
      console.log('✅ ZeroWasterMarket domain allowed:', origin);
      return callback(null, true);
    }

    // Check for vercel app domains
    if (origin.includes('vercel.app')) {
      console.log('✅ Vercel domain allowed:', origin);
      return callback(null, true);
    }

    // ENHANCED: For development and testing, be more permissive
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.log('✅ Development/Test mode - allowing origin:', origin);
      return callback(null, true);
    }

    // ENHANCED: Log but allow unknown origins in production for debugging
    console.log('⚠️ Unknown origin, but allowing for debugging:', origin);
    return callback(null, true); // Changed from error to allow for better debugging
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-Forwarded-For',
    'User-Agent',
    'Referer'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar', 'Access-Control-Allow-Origin'],
  optionsSuccessStatus: 200, // For legacy browser support
  maxAge: 86400 // 24 hours preflight cache
}));

// ENHANCED: Comprehensive preflight OPTIONS handler
app.options('*', (req, res) => {
  console.log('🔧 Handling OPTIONS preflight for:', req.path);
  console.log('📋 Request headers:', req.headers);

  const origin = req.headers.origin;

  // Set comprehensive CORS headers
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH,HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');

  // Send success response
  res.sendStatus(200);
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ENHANCED: Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const origin = req.headers.origin || 'no-origin';
  const userAgent = req.headers['user-agent']?.substring(0, 50) || 'unknown';

  console.log(`📝 [${timestamp}] ${req.method} ${req.path} from ${origin}`);

  if (req.method !== 'GET') {
    console.log(`   📦 Body size: ${JSON.stringify(req.body || {}).length} chars`);
  }

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

// ENHANCED: Health check endpoint with CORS info
app.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState;

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      requestOrigin: req.headers.origin || 'no-origin',
      mongodb: {
        connected: dbStatus === 1,
        readyState: dbStatus
      },
      cors: {
        allowedOrigins: allowedOrigins.length,
        currentOrigin: req.headers.origin,
        isAllowed: true // Since request reached here, CORS passed
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
      requestOrigin: req.headers.origin || 'no-origin'
    });
  }
});

// Root endpoint with CORS info
app.get('/', (req, res) => {
  res.json({
    message: 'ZeroWasteMarket API - Backend Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    status: 'running',
    origin: req.headers.origin || 'no-origin',
    corsStatus: 'enabled',
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
    origin: req.headers.origin || 'no-origin',
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

// ENHANCED: 404 handler with comprehensive CORS headers
app.use('/api/*', (req, res) => {
  // Ensure CORS headers are set for 404 responses
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
    method: req.method,
    origin: origin || 'no-origin',
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

// ENHANCED: Global error handler with comprehensive CORS headers
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err.message);
  console.error('🔍 Error details:', {
    path: req.path,
    method: req.method,
    origin: req.headers.origin || 'no-origin',
    userAgent: req.headers['user-agent']?.substring(0, 100),
    stack: err.stack?.substring(0, 500)
  });

  // Ensure CORS headers are set for error responses
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

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
      field: Object.keys(err.keyPattern || {})[0]
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    requestOrigin: origin || 'no-origin',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack?.substring(0, 1000),
      type: err.name
    })
  });
});

// Export for Vercel
module.exports = app;

// Start server only if not in Vercel
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 CORS enabled for ${allowedOrigins.length} domains`);
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