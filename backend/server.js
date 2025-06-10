// backend/server.js - FINAL CORS FIX
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

// FIXED: Complete allowed origins list including production domain
const allowedOrigins = [
  // Development
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://localhost:5173', // Vite
  'http://localhost:8080', // Vue CLI

  // Production domains
  'https://www.zerowastemarket.web.id', // YOUR PRODUCTION DOMAIN
  'https://zerowastemarket.web.id',     // Without www
  'https://zerowaste-frontend-eosin.vercel.app',
  'https://zerowaste-backend-theta.vercel.app',

  // Environment variable
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log('🌐 Configured CORS origins:', allowedOrigins);

// ENHANCED CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    console.log('🔍 Request origin:', origin || 'no-origin');

    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) {
      console.log('✅ Allowing request with no origin');
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin allowed:', origin);
      return callback(null, true);
    }

    // Allow localhost with any port for development
    if (origin.match(/^https?:\/\/localhost:\d+$/) ||
      origin.match(/^https?:\/\/127\.0\.0\.1:\d+$/)) {
      console.log('✅ Localhost origin allowed:', origin);
      return callback(null, true);
    }

    // Allow *.vercel.app domains
    if (origin.match(/^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/)) {
      console.log('✅ Vercel domain allowed:', origin);
      return callback(null, true);
    }

    // Log and reject other origins
    console.log('❌ CORS rejected origin:', origin);
    console.log('❌ Allowed origins:', allowedOrigins);

    return callback(new Error(`CORS policy: Origin ${origin} not allowed`), false);
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
    'Expires',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Handle preflight requests explicitly for all routes
app.options('*', (req, res) => {
  const origin = req.get('Origin');
  console.log('🔄 Preflight request from:', origin);

  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization,Cache-Control,Pragma,Expires');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');

  res.sendStatus(200);
});

// Additional CORS headers middleware
app.use((req, res, next) => {
  const origin = req.get('Origin');

  if (origin && (allowedOrigins.includes(origin) ||
    origin.match(/^https?:\/\/localhost:\d+$/) ||
    origin.match(/^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }

  // Security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const origin = req.get('Origin') || 'no-origin';
  const userAgent = req.get('User-Agent')?.substring(0, 50) || 'no-agent';

  console.log(`📝 ${timestamp} ${req.method} ${req.url}`);
  console.log(`   🌐 Origin: ${origin}`);
  console.log(`   🖥️ User-Agent: ${userAgent}`);

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

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState;
    const origin = req.get('Origin');

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      mongodb: {
        connected: dbStatus === 1,
        readyState: dbStatus
      },
      cors: {
        requestOrigin: origin || 'none',
        allowedOrigins: allowedOrigins.length,
        originAllowed: !origin || allowedOrigins.includes(origin) ||
          origin.match(/^https?:\/\/localhost:\d+$/) ||
          origin.match(/^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/)
      },
      features: {
        orders: !!orderRoutes,
        payments: !!paymentRoutes,
        products: !!productRoutes,
        wishlist: !!wishlistRoutes,
        cart: !!cartRoutes
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
  const origin = req.get('Origin');

  res.json({
    message: 'ZeroWasteMarket API - Backend Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    status: 'running',
    cors: {
      requestOrigin: origin || 'none',
      originAllowed: !origin || allowedOrigins.includes(origin)
    },
    endpoints: [
      '/api/auth - Authentication',
      '/api/users - User Management',
      '/api/products - Product Management',
      '/api/orders - Order History',
      '/api/payment - Payment Integration',
      '/api/admin - Admin Panel',
      '/api/wishlist - Wishlist',
      '/api/cart - Shopping Cart'
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
app.use('/api/orders', orderRoutes);

// Static files serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API endpoint listing
app.get('/api', (req, res) => {
  const origin = req.get('Origin');

  res.json({
    message: 'ZeroWasteMarket API Endpoints',
    version: '1.0.0',
    requestOrigin: origin || 'none',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      orders: '/api/orders',
      payment: '/api/payment',
      admin: '/api/admin',
      wishlist: '/api/wishlist',
      cart: '/api/cart'
    }
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
    method: req.method,
    origin: req.get('Origin') || 'none',
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
  console.error('🚨 Stack:', err.stack);

  // Handle CORS errors specifically
  if (err.message.includes('CORS policy') || err.message.includes('not allowed')) {
    const origin = req.get('Origin');
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      error: err.message,
      origin: origin,
      allowedOrigins: allowedOrigins,
      suggestion: 'Please check if your domain is added to the allowed origins list'
    });
  }

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

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      origin: req.get('Origin')
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
    console.log(`🌐 CORS allowed origins:`, allowedOrigins);
    console.log(`📋 Available endpoints:`);
    console.log(`   - Health: http://localhost:${PORT}/health`);
    console.log(`   - API: http://localhost:${PORT}/api`);
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