const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://zerowastemarket:zerowastemarket@zerowastemarket.usk9srj.mongodb.net/zerowastemarket?retryWrites=true&w=majority&appName=zerowastemarket';

const connectDB = async () => {
  try {
    console.log(`🔄 Connecting to MongoDB Atlas...`);

    const conn = await mongoose.connect(MONGO_URI, {
      // Atlas-specific options
      serverSelectionTimeoutMS: 30000, // 30 detik untuk Atlas
      socketTimeoutMS: 75000, // 75 detik socket timeout
      bufferMaxEntries: 0,
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 30000, // 30 detik connection timeout
      family: 4, // Gunakan IPv4
    });

    console.log(`✅ MongoDB Atlas Connected to: ${conn.connection.host}`);
    console.log(`📊 Using Database: ${conn.connection.name}`);

  } catch (error) {
    console.error(`❌ Atlas Connection Error: ${error.message}`);

    // Jangan auto-retry untuk Atlas errors
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose Atlas error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from Atlas');
});

module.exports = connectDB;