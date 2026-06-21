const express = require('express');
const router = express.Router();

// Import your existing auth controllers and the new profile controllers
const { 
  register, 
  login, 
  verifyOTP, 
  forgotPassword, 
  resetPassword, 
  getProfile,      // 🌟 New
  updateProfile    // 🌟 New
} = require('../controllers/authController');

// Import the protect middleware to secure the profile routes
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);

// New Routes for Password Reset
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// 🌟 New Routes for Profile Management
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;