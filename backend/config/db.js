const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/zerowastemarket';

const connectDB = async () => {
  try {
    console.log(`🔄 Connecting to MongoDB at: ${MONGO_URI}`);
    const conn = await mongoose.connect(MONGO_URI, {});
    console.log(` MongoDB Connected to: ${conn.connection.host}`);
    console.log(`Using Database: ${conn.connection.name}`); // Tambahkan ini
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
