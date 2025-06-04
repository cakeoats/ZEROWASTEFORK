// backend/server.js - VERCEL OPTIMIZED FOR PRODUCTION
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

const app = express();

// VERCEL OPTIMIZED: Enhanced allowed origins for production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://zerowaste-frontend-eosin.vercel.app',
  'https://zerowaste-backend-theta.vercel.app',
  // Add your custom domain if you have one
  'https://your-custom-domain.com',
  process.env.FRONTEND_URL,
].filter(Boolean);

// VERCEL OPTIMIZED: Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list or is localhost
    if (allowedOrigins.includes(origin) || origin.match(/^http:\/\/localhost:\d+$/)) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
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
    'x-vercel-warmup'
  ],
  optionsSuccessStatus: 200 // For legacy browser support
}));

// VERCEL OPTIMIZED: Body parsing middleware with larger limits
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// VERCEL OPTIMIZED: Database connection handling for serverless
let isConnected = false;
let connectionAttempts = 0;
const maxConnectionAttempts = 3;

const initializeDB = async () => {
  if (isConnected) {
    return true;
  }

  connectionAttempts++;

  try {
    console.log(`🔄 Database connection attempt ${connectionAttempts}/${maxConnectionAttempts}`);
    await connectDB();
    isConnected = true;
    console.log('✅ Database initialized for Vercel serverless');
    return true;
  } catch (error) {
    console.error(`❌ Database connection attempt ${connectionAttempts} failed:`, error.message);

    if (connectionAttempts >= maxConnectionAttempts) {
      console.error('💥 Max database connection attempts reached');
      throw error;
    }

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, 1000));
    return initializeDB();
  }
};

// VERCEL OPTIMIZED: Middleware to ensure DB connection with timeout
app.use(async (req, res, next) => {
  // Skip DB check for health endpoints
  if (req.path === '/health' || req.path === '/') {
    return next();
  }

  try {
    // Add timeout for database initialization
    const dbTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timeout')), 10000)
    );

    await Promise.race([initializeDB(), dbTimeout]);
    next();
  } catch (error) {
    console.error('❌ Database middleware error:', error.message);

    // Send appropriate error response
    if (error.message.includes('timeout')) {
      res.status(503).json({
        success: false,
        message: 'Database connection timeout. Please try again.',
        error: 'SERVICE_UNAVAILABLE'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
      });
    }
  }
});

// VERCEL OPTIMIZED: Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState;

    // Quick connectivity check
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      vercel: {
        region: process.env.VERCEL_REGION || 'unknown',
        deployment: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'unknown'
      },
      mongodb: {
        connected: dbStatus === 1,
        readyState: dbStatus,
        connectionAttempts: connectionAttempts
      },
      midtrans: {
        environment: process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'PRODUCTION' : 'SANDBOX',
        configured: !!(process.env.MIDTRANS_SERVER_KEY_PRODUCTION || process.env.MIDTRANS_SERVER_KEY_SANDBOX)
      }
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Root endpoint with enhanced info
app.get('/', (req, res) => {
  res.json({
    message: 'ZeroWasteMarket API - Backend Server',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    platform: 'Vercel Serverless',
    database: isConnected ? 'connected' : 'disconnected',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      products: '/api/products/*',
      payment: '/api/payment/*',
      admin: '/api/admin/*'
    }
  });
});

// API Routes with error boundaries
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);

// VERCEL OPTIMIZED: Static files serving (simplified for serverless)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1y', // Cache for 1 year
  etag: true,
  lastModified: true
}));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
    method: req.method,
    availableRoutes: [
      '/api/auth/*',
      '/api/users/*',
      '/api/products/*',
      '/api/admin/*',
      '/api/wishlist/*',
      '/api/cart/*',
      '/api/payment/*'
    ]
  });
});

// VERCEL OPTIMIZED: Global error handler with enhanced logging
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent')
  });

  // Handle specific error types
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      error: 'CORS_ERROR'
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request payload too large',
      error: 'PAYLOAD_TOO_LARGE'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// VERCEL OPTIMIZED: Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, starting graceful shutdown...');
  // Close database connections
  const mongoose = require('mongoose');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, starting graceful shutdown...');
  const mongoose = require('mongoose');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Export for Vercel
module.exports = app;

// Start server only if not in Vercel environment
if (require.main === module && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🎯 Midtrans: ${process.env.MIDTRANS_IS_PRODUCTION === 'true' ? 'PRODUCTION' : 'SANDBOX'}`);
    await initializeDB();
  });
}