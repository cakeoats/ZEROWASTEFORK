const User = require('../models/User');
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

module.exports = { 
  updateProfile, 
  getProfile, 
  changePassword,
  updateProfilePicture
};