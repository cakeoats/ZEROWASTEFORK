const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./route/authRoutes');
const userRoutes = require('./route/userRoutes');
const productRoutes = require('./route/productRoutes');
const adminRoutes = require('./route/adminRoutes');
const wishlistRoutes = require('./route/wishlistRoutes');
const cartRoutes = require('./route/cartRoutes');
const paymentRoutes = require('./route/paymentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Specific allowed origins for your deployment
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://zerowaste-frontend-eosin.vercel.app', // Your actual frontend URL
  'https://zerowaste-backend-theta.vercel.app',  // Your actual backend URL
  process.env.FRONTEND_URL, // From environment variable
].filter(Boolean);

console.log('🌐 Allowed CORS Origins:', allowedOrigins);

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.includes(origin) ||
      origin.match(/^http:\/\/localhost:\d+$/);

    if (isAllowed) {
      console.log('✅ CORS allowed for origin:', origin);
      callback(null, true);
    } else {
      console.warn('🚫 CORS blocked origin:', origin);
      callback(null, false); // Don't throw error, just deny
    }
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
    'Pragma'
  ],
  exposedHeaders: ['Content-Length'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log('🔀 CORS Preflight from:', origin);

  if (allowedOrigins.includes(origin) || (origin && origin.match(/^http:\/\/localhost:\d+$/))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  }

  res.sendStatus(200);
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const origin = req.headers.origin || 'No origin';

  console.log(`${timestamp} - ${req.method} ${req.path} from ${origin}`);

  // Enhanced logging for auth requests
  if (req.path.includes('/auth/')) {
    console.log(`🔐 Auth request:`, {
      method: req.method,
      path: req.path,
      origin: origin,
      hasAuth: !!req.headers.authorization,
      contentType: req.headers['content-type']
    });
  }

  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/zerowastemarket')
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    cors: {
      allowedOrigins: allowedOrigins,
      requestOrigin: req.headers.origin || 'none'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ZeroWasteMarket API - Vercel Deployment',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    frontend: 'https://zerowaste-frontend-eosin.vercel.app',
    backend: 'https://zerowaste-backend-theta.vercel.app',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products'
    }
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

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.warn(`❓ 404 - API endpoint not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', {
    message: err.message,
    path: req.path,
    method: req.method,
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });

  // Don't expose stack trace in production
  const errorResponse = {
    success: false,
    message: err.message || 'Something went wrong!',
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(err.status || 500).json(errorResponse);
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 ZeroWasteMarket API Server Started');
  console.log(`📍 Server: https://zerowaste-backend-theta.vercel.app`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 MongoDB: ${process.env.MONGO_URI ? 'Configured' : 'Using default'}`);
  console.log(`🌐 Frontend: https://zerowaste-frontend-eosin.vercel.app`);
  console.log(`🔐 CORS Origins: ${allowedOrigins.length} configured`);
  console.log('✅ Server ready to accept connections');
});

module.exports = app;