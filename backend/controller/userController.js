// backend/controller/userController.js - FIXED VERSION
const User = require('../models/User');
const Product = require('../models/product');
const bcrypt = require('bcryptjs');

const updateProfile = async (req, res) => {
  const userId = req.user._id; // dari token
  const { full_name, username, phone, address, bio } = req.body; // Changed name to full_name, added bio

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update allowed fields
    user.full_name = full_name || user.full_name;
    user.username = username || user.username;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.bio = bio || user.bio; // Add bio

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        full_name: user.full_name,
        username: user.username,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        joinedAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Error in updateProfile:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    console.log('Fetching profile for user ID:', req.user._id);
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const response = {
      full_name: user.full_name,  // Changed name to full_name
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      bio: user.bio || '',  // Added bio
      joinedAt: user.createdAt,
      profilePicture: user.profilePicture || '',
    };
    console.log('Profile data sent:', response);
    res.json(response);
  } catch (err) {
    console.error('Error in getProfile:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Tambah fungsi untuk mengubah password
const changePassword = async (req, res) => {
  const userId = req.user._id;
  const { currentPassword, newPassword } = req.body;

  try {
    // Temukan user berdasarkan ID
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Verifikasi password saat ini
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Password saat ini tidak valid' });

    // Hash password baru
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Simpan perubahan
    await user.save();

    res.json({ message: 'Password berhasil diubah' });
  } catch (err) {
    console.error('Error in changePassword:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fungsi untuk mengupdate foto profil
const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;

    // Pastikan ada file yang diupload
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diupload' });
    }

    // Dapatkan path file yang diupload
    const profilePicturePath = `uploads/${req.file.filename}`;

    // Update user dengan path gambar baru
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: profilePicturePath },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json({
      message: 'Foto profil berhasil diperbarui',
      profilePicture: profilePicturePath
    });
  } catch (err) {
    console.error('Error updating profile picture:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// FIXED: Get user products function dengan query yang benar
const getUserProducts = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log('🔍 Fetching products for user ID:', userId);
    console.log('👤 User object from token:', {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email
    });

    // FIXED: Query yang benar untuk mencari produk berdasarkan seller_id
    // Tidak menggunakan query middleware yang mungkin memfilter produk
    const products = await Product.find({
      seller_id: userId,
      // FIXED: Jangan filter berdasarkan status untuk "My Products"
      // User harus bisa melihat semua produknya termasuk yang sold/inactive
    })
      .populate('seller_id', 'username full_name email') // Populate seller info
      .sort({ createdAt: -1 }) // Sort by creation date (newest first)
      .lean(); // Convert to plain JS objects for better performance

    console.log('📦 Found products:', products.length);

    // Debug: Log beberapa produk untuk memverifikasi seller_id
    if (products.length > 0) {
      console.log('📋 Sample products:');
      products.slice(0, 3).forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - seller_id: ${product.seller_id?._id || product.seller_id}`);
      });
    } else {
      console.log('❌ No products found. Checking all products in database...');

      // Debug: Check if there are any products at all for this user
      const allUserProducts = await Product.find({}).select('seller_id name').lean();
      console.log('🔍 All products in database:');
      allUserProducts.forEach((product, index) => {
        if (index < 5) { // Show first 5 for debugging
          console.log(`   ${index + 1}. ${product.name} - seller_id: ${product.seller_id}`);
        }
      });

      // Check if userId matches any seller_id
      const matchingProducts = allUserProducts.filter(p =>
        p.seller_id && p.seller_id.toString() === userId.toString()
      );
      console.log(`🔍 Products matching user ID ${userId}:`, matchingProducts.length);
    }

    // FIXED: Ensure we return the products with proper image URLs
    const productsWithImages = products.map(product => {
      // Add image URLs for backward compatibility
      if (product.images && product.images.length > 0) {
        product.imageUrls = product.images;
        product.imageUrl = product.images[0];
      }
      return product;
    });

    // Return the products
    res.json(productsWithImages);
  } catch (err) {
    console.error('💥 Error fetching user products:', err);
    res.status(500).json({
      message: 'Server error while fetching products',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

module.exports = {
  updateProfile,
  getProfile,
  changePassword,
  updateProfilePicture,
  getUserProducts
};