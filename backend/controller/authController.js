const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// REGISTER
exports.register = async (req, res) => {
  const { username, email, password, full_name, phone, address } = req.body;
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpires = Date.now() + 3600000; // 1 jam (ms)

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      full_name,
      phone,
      address,
      verificationToken,
      verificationTokenExpires,
      isVerified: false,
    });

    await newUser.save();

    const verificationLink = `${process.env.BASE_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${verificationToken}`;
    const emailContent = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h2>Hi, ${full_name || username}!</h2>
    <p>Terima kasih telah mendaftar di <strong>ZeroWasteMarket</strong>! 🌱</p>
    <p>
      Kami sangat senang sekali menyambut Anda sebagai bagian dari komunitas kami yang peduli terhadap lingkungan 🌍.
      Silakan verifikasi email Anda dengan mengklik tautan di bawah ini:
    </p>
    <p>
      <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 5px;">
        Verifikasi Email Saya
      </a>
    </p>
    <p style="color: #888;"><em>Catatan: Tautan ini akan kedaluwarsa dalam waktu 1 jam.</em></p>
    <p>
      Kami tidak sabar menunggu Anda untuk mulai menjelajahi dan berbelanja produk-produk ramah lingkungan di platform kami.
      Terima kasih telah ikut serta dalam misi menuju gaya hidup yang lebih berkelanjutan! 🌿
    </p>
    <p>Salam hangat,<br><strong>Tim ZeroWasteMarket</strong></p>
  </div>
`;

    await sendEmail(email, 'Verify your email for ZeroWasteMarket', emailContent);

    res.status(201).json({ message: 'User registered successfully! Please check your email to verify.' });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/verif-email?status=expired`);
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/success-email`);
  } catch (err) {
    console.error('Email Verification Error:', err);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/verif-email?status=error`);
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Email not verified. Please check your email.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: `HI, Welcome back ${user.username} 👋`,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        joinedAt: user.createdAt,
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 3600000; // 1 jam

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const emailContent = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h3>Halo ${user.full_name},</h3>
    <p>Kami menerima permintaan untuk mengatur ulang password akun Anda di <strong>ZeroWasteMarket</strong>.</p>
    <p>
      Jangan khawatir! Untuk melanjutkan proses ini, silakan klik tombol di bawah:
    </p>
    <p>
      <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">
        Reset Password
      </a>
    </p>
    <p>Jika Anda tidak merasa melakukan permintaan ini, abaikan saja email ini — akun Anda tetap aman.</p>
    <p style="color: #888;"><em>Catatan: Tautan reset password ini hanya berlaku selama 1 jam.</em></p>
    <p>Terima kasih telah menjadi bagian dari perjalanan menuju gaya hidup yang lebih berkelanjutan bersama kami! 🌿</p>
    <p>Salam hangat,<br><strong>Tim ZeroWasteMarket</strong></p>
  </div>
`;


    await sendEmail(user.email, 'Reset your ZeroWasteMarket password', emailContent);
    res.status(200).json({ message: 'Reset password email sent!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while sending reset password email' });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password successfully reset!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

//resend email
exports.resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Buat token baru
    const newToken = crypto.randomBytes(32).toString('hex');
    const newTokenExpires = Date.now() + 3600000; // 1 jam

    user.verificationToken = newToken;
    user.verificationTokenExpires = newTokenExpires;
    await user.save();

    const verificationLink = `${process.env.BASE_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${newToken}`;
    const emailContent = `
      <div style="font-family: Arial, sans-serif;">
  <h3>Halo ${user.full_name},</h3>
  <p>Sepertinya kamu lupa untuk memverifikasi emailmu setelah mendaftar di <strong>ZeroWasteMarket</strong>.</p>
  <p>Tidak masalah, kami di sini untuk membantumu menyelesaikannya. Silakan klik tombol di bawah ini untuk memverifikasi email kamu dan mulai menjelajahi dunia belanja yang lebih ramah lingkungan 🌱</p>
  <a href="${verificationLink}" style="background-color:#22c55e;padding:10px 15px;color:white;text-decoration:none;border-radius:5px;">Verifikasi Email</a>
  <p><em>Catatan: Tautan ini hanya berlaku selama 1 jam.</em></p>
  <p>Terima kasih telah bergabung dengan kami dalam misi menuju gaya hidup yang lebih berkelanjutan. 🌍</p>
</div>
    `;

    await sendEmail(user.email, 'New verification link from ZeroWasteMarket', emailContent);
    res.status(200).json({ message: 'Verification email resent successfully' });
  } catch (err) {
    console.error('Resend Verification Error:', err);
    res.status(500).json({ message: 'Server error while resending email' });
  }
};

