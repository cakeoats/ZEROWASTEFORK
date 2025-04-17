const User = require('../models/User');

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
    };
    console.log('Profile data sent:', response);
    res.json(response);
  } catch (err) {
    console.error('Error in getProfile:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { updateProfile, getProfile };