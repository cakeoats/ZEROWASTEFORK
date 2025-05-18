const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Perbaiki path impor
const authRoutes = require('./route/authRoutes');
const userRoutes = require('./route/userRoutes');
const productRoutes = require('./route/productRoutes');
const adminRoutes = require('./route/adminRoutes'); // Import admin routes
const wishlistRoutes = require('./route/wishlistRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true, // Untuk cookie atau header auth
}));
app.use(express.json()); // Parsing body JSON

// Connect ke MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zerowastemarket', {
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Keluar jika gagal connect
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes); // Tambahkan admin routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/wishlist', wishlistRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});