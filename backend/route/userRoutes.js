const express = require('express');
const { updateProfile, getProfile, changePassword, updateProfilePicture, getUserProducts } = require('../controller/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.put('/profile', protect, updateProfile);
router.get('/profile', protect, getProfile);
router.post('/change-password', protect, changePassword);
router.post('/profile-picture', protect, upload.single('profilePicture'), updateProfilePicture);
router.get('/products', protect, getUserProducts);

module.exports = router;