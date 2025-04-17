const express = require('express');
const { updateProfile, getProfile } = require('../controller/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.put('/profile', protect, updateProfile);
router.get('/profile', protect, getProfile);

module.exports = router;