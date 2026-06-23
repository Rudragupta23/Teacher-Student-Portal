const express = require('express');
const router = express.Router();

const { 
  register, 
  login, 
  verifyOTP, 
  forgotPassword, 
  resetPassword, 
  getProfile,      
  updateProfile    
} = require('../controllers/authController');

const { protect } = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;