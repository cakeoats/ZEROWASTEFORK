// backend/config/db.js - FIXED VERSION
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    // Jika sudah terhubung, jangan koneksi lagi
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return;
    }

    console.log('🔄 Connecting to MongoDB Atlas...');

    // Pastikan MONGO_URI ada
    if (!MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not defined');
    }

    const conn = await mongoose.connect(MONGO_URI, {
      // HAPUS semua opsi yang tidak didukung
      serverSelectionTimeoutMS: 10000, // Kurangi timeout untuk Vercel
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 5, // Kurangi pool size untuk serverless
      minPoolSize: 1,
      maxIdleTimeMS: 10000,
      retryWrites: true,
      w: 'majority'
    });

    console.log('✅ MongoDB Connected Successfully!');
    return conn;

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);

    // Jangan exit di serverless environment
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    throw error;
  }
};

// Hapus event listeners untuk serverless
module.exports = connectDB;