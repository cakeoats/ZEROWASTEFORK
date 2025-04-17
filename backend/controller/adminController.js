const Admin = require('../models/admin');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    console.log('Login attempt for username:', username);
    
    const admin = await Admin.findOne({ username });
    
    if (!admin) {
      console.log('Admin not found');
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
    
    console.log('Admin found:', admin);
    
    const isMatch = await bcrypt.compare(password, admin.password);
    
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
    
    res.json({ success: true, message: 'Login successful', adminId: admin._id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};