const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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
  'https://zerowaste-frontend-eosin.vercel.app',
  'https://zerowaste-backend-theta.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log('🌐 Allowed CORS Origins:', allowedOrigins);

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.includes(origin) ||
      origin.match(/^http:\/\/localhost:\d+$/);

    if (isAllowed) {
      console.log('✅ CORS allowed for origin:', origin);
      callback(null, true);
    } else {
      console.warn('🚫 CORS blocked origin:', origin);
      callback(null, false);
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
  maxAge: 86400,
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

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Enhanced static file serving with proper headers and error handling
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=31536000');

  console.log('📸 Image request:', req.path);

  const filePath = path.join(__dirname, 'uploads', req.path);

  if (fs.existsSync(filePath)) {
    console.log('✅ Image found:', filePath);
    next();
  } else {
    console.log('❌ Image not found:', filePath);
    res.status(404).json({
      error: 'Image not found',
      path: req.path,
      fullPath: filePath,
      timestamp: new Date().toISOString()
    });
  }
}, express.static(path.join(__dirname, 'uploads')));

// Fallback route for missing images
app.get('/uploads/*', (req, res) => {
  console.log('🔍 Fallback image request:', req.path);
  res.status(404).json({
    error: 'Image not found',
    path: req.path,
    message: 'This image does not exist on the server',
    timestamp: new Date().toISOString()
  });
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const origin = req.headers.origin || 'No origin';

  console.log(`${timestamp} - ${req.method} ${req.path} from ${origin}`);

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

// FIXED: Connect to MongoDB dengan konfigurasi yang benar
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');

    const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://zerowastemarket:zerowastemarket@zerowastemarket.usk9srj.mongodb.net/zerowastemarket?retryWrites=true&w=majority&appName=zerowastemarket';

    await mongoose.connect(MONGO_URI, {
      // HANYA gunakan opsi yang didukung
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 75000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority',
      family: 4,
      // HAPUS opsi yang menyebabkan error:
      // bufferCommands: false,    // <- INI YANG MENYEBABKAN ERROR
      // bufferMaxEntries: 0,      // <- INI JUGA
    });

    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📍 Host: ${mongoose.connection.host}`);
    console.log(`📊 Database: ${mongoose.connection.name}`);

    // Test ping
    await mongoose.connection.db.admin().ping();
    console.log('🏓 Database ping successful');

  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);

    if (err.message.includes('buffermaxentries')) {
      console.error('🔧 Configuration error: Remove unsupported Mongoose options');
    } else if (err.message.includes('Authentication failed')) {
      console.error('🔐 Check MongoDB Atlas credentials');
    } else if (err.message.includes('timeout')) {
      console.error('⏰ Check network and Atlas IP whitelist');
    }

    process.exit(1);
  }
};

// Health check endpoint with enhanced database status
app.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const dbStatusText = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting'
    }[dbStatus] || 'Unknown';

    let dbPing = false;
    if (dbStatus === 1) {
      try {
        await mongoose.connection.db.admin().ping();
        dbPing = true;
      } catch (e) {
        dbPing = false;
      }
    }

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      mongodb: {
        status: dbStatusText,
        readyState: dbStatus,
        connected: dbStatus === 1,
        ping: dbPing,
        host: mongoose.connection.host || 'Not connected',
        database: mongoose.connection.name || 'Not connected',
      },
      uploadsDir: fs.existsSync(uploadsDir) ? 'Exists' : 'Missing',
      cors: {
        allowedOrigins: allowedOrigins,
        requestOrigin: req.headers.origin || 'none'
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
    database: {
      status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      host: mongoose.connection.host || 'Not connected',
    },
    frontend: 'https://zerowaste-frontend-eosin.vercel.app',
    backend: 'https://zerowaste-backend-theta.vercel.app',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      uploads: '/uploads'
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

// Enhanced startup dengan database check
const startServer = async () => {
  try {
    console.log('\n🚀 Starting ZeroWasteMarket API Server...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Port: ${PORT}`);

    // Connect database first
    await connectDB();

    // Start server setelah database connected
    app.listen(PORT, () => {
      console.log('\n✅ ZeroWasteMarket API Server Started Successfully!');
      console.log(`📍 Server: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 MongoDB: Connected to Atlas`);
      console.log(`🌐 Frontend: https://zerowaste-frontend-eosin.vercel.app`);
      console.log(`🔐 CORS Origins: ${allowedOrigins.length} configured`);
      console.log(`📁 Uploads Dir: ${fs.existsSync(uploadsDir) ? 'Ready' : 'Missing'}`);
      console.log('🎉 Ready to accept connections!');
    });

  } catch (error) {
    console.error('\n💥 Failed to start server:', error.message);

    if (error.message.includes('EADDRINUSE')) {
      console.error(`🔧 Port ${PORT} is already in use`);
    } else if (error.message.includes('buffermaxentries')) {
      console.error('🔧 Mongoose configuration error - check database connection options');
    }

    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;