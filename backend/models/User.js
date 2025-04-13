const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  full_name: { type: String },
  phone: { type: String },
  address: { type: String },
  bio: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpires: { type: Date }, 
  resetPasswordToken: { type: String},
  resetPasswordExpires: { type: Date},
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
