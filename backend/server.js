const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./route/authRoutes'); // ⬅️ pastikan path ini benar

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true,               
}));
app.use(express.json()); // untuk parsing body JSON

// ✅ Connect ke MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zerowastemarket', {
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

// ✅ Routes
app.use('/api/auth', authRoutes); // Semua route diatur dari sini

// ✅ Jalankan server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
