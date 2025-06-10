// backend/controller/userController.js - UPDATED dengan Supabase Profile Picture Upload
const User = require('../models/User');
const Product = require('../models/product');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase'); // Import Supabase config
const { v4: uuidv4 } = require('uuid');

// Get bucket name from config
const BUCKET_NAME = supabase.BUCKET_NAME || 'product-image'; // Use same bucket as products

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

// UPDATED: Fungsi untuk mengupdate foto profil dengan Supabase
const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log('📷 Profile picture upload request for user:', userId);
    console.log('📂 Files received:', req.files ? req.files.length : 0);
    console.log('📂 Single file:', req.file ? 'Yes' : 'No');

    // Pastikan ada file yang diupload
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang diupload'
      });
    }

    const file = req.file;
    console.log('📄 File details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      buffer: file.buffer ? 'Present' : 'Missing'
    });

    // Validasi file type
    if (!file.mimetype.startsWith('image/')) {
      console.log('❌ Invalid file type:', file.mimetype);
      return res.status(400).json({
        success: false,
        message: 'File harus berupa gambar (JPG, PNG, GIF)'
      });
    }

    // Validasi file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('❌ File too large:', file.size);
      return res.status(400).json({
        success: false,
        message: 'Ukuran file maksimal 5MB'
      });
    }

    // Get current user to check for existing profile picture
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Delete old profile picture from Supabase if exists
    if (user.profilePicture) {
      try {
        console.log('🗑️ Deleting old profile picture:', user.profilePicture);

        // Extract file path from URL
        const oldFilePath = extractFilePathFromUrl(user.profilePicture);
        if (oldFilePath) {
          const { error: deleteError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([oldFilePath]);

          if (deleteError) {
            console.error('⚠️ Error deleting old profile picture:', deleteError);
            // Continue anyway, don't fail the upload
          } else {
            console.log('✅ Old profile picture deleted successfully');
          }
        }
      } catch (deleteErr) {
        console.error('⚠️ Error during old file cleanup:', deleteErr);
        // Continue anyway
      }
    }

    // Generate unique filename with user folder structure
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    const fileName = `profiles/${userId}/${uuidv4()}.${fileExtension}`;

    console.log(`📤 Uploading profile picture to Supabase: ${fileName}`);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengupload file ke storage',
        error: uploadError.message
      });
    }

    console.log('✅ File uploaded to Supabase:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      console.error('❌ Failed to get public URL');
      return res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan URL gambar'
      });
    }

    const profilePictureUrl = urlData.publicUrl;
    console.log('🌐 Profile picture public URL:', profilePictureUrl);

    // Update user with new profile picture URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: profilePictureUrl },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      console.log('❌ Failed to update user record');
      return res.status(500).json({
        success: false,
        message: 'Gagal memperbarui data user'
      });
    }

    console.log('✅ Profile picture updated successfully');

    res.json({
      success: true,
      message: 'Foto profil berhasil diperbarui',
      profilePicture: profilePictureUrl,
      user: {
        full_name: updatedUser.full_name,
        username: updatedUser.username,
        profilePicture: updatedUser.profilePicture
      }
    });

  } catch (err) {
    console.error('💥 Error updating profile picture:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};

// Helper function to extract file path from Supabase URL
const extractFilePathFromUrl = (url) => {
  try {
    if (!url || typeof url !== 'string') return null;

    // URL format: https://project.supabase.co/storage/v1/object/public/bucket/path
    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex(part => part === BUCKET_NAME);

    if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
      return urlParts.slice(bucketIndex + 1).join('/');
    }

    return null;
  } catch (error) {
    console.error('❌ Error extracting file path:', error);
    return null;
  }
};

// Get user products
const getUserProducts = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all products where seller_id matches the current user's ID
    const products = await Product.find({ seller_id: userId })
      .sort({ createdAt: -1 }) // Sort by creation date (newest first)
      .lean(); // Convert to plain JS objects for better performance

    // Return the products
    res.json(products);
  } catch (err) {
    console.error('Error fetching user products:', err);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
};

module.exports = {
  updateProfile,
  getProfile,
  changePassword,
  updateProfilePicture,
  getUserProducts
};