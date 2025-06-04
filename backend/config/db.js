// backend/config/db.js - Versi yang diperbaiki
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || '';

const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    console.log('🌐 Target:', MONGO_URI.split('@')[1].split('/')[0]); // Show host without credentials

    const conn = await mongoose.connect(MONGO_URI, {
      // Hanya gunakan opsi yang didukung Mongoose terbaru
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 75000, // 75 seconds  
      connectTimeoutMS: 30000, // 30 seconds
      maxPoolSize: 10, // Maximum connections
      minPoolSize: 2, // Minimum connections
      maxIdleTimeMS: 30000, // Close idle connections after 30s

      // Opsi tambahan untuk Atlas
      retryWrites: true,
      w: 'majority',
      family: 4, // Use IPv4

      // HAPUS opsi yang tidak didukung:
      // bufferCommands: false,     // <- Menyebabkan error
      // bufferMaxEntries: 0,       // <- Menyebabkan error
    });

    console.log('✅ MongoDB Atlas Connected Successfully!');
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔌 Ready State: ${mongoose.connection.readyState}`);

    // Test ping untuk memastikan koneksi bekerja
    await mongoose.connection.db.admin().ping();
    console.log('🏓 Database ping successful');

  } catch (error) {
    console.error('❌ MongoDB Atlas Connection Error:', error.message);

    // Specific error handling
    if (error.message.includes('Authentication failed')) {
      console.error('🔐 Check username/password in Atlas dashboard');
    } else if (error.message.includes('timeout')) {
      console.error('⏰ Check network connection and Atlas IP whitelist');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🌐 DNS resolution failed - check internet connection');
    } else if (error.message.includes('buffermaxentries')) {
      console.error('🔧 Mongoose configuration error - remove unsupported options');
    }

    // Exit process jika tidak bisa connect
    console.error('💥 Application will exit due to database connection failure');
    process.exit(1);
  }
};

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB Atlas');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 Mongoose reconnected to MongoDB Atlas');
});

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed through app termination (SIGINT)');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed through app termination (SIGTERM)');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

module.exports = connectDB;
