const express = require('express');
const router = express.Router();

const { 
  register, 
  login, 
  verifyOTP, 
  forgotPassword, 
  resetPassword, 
  getProfile,      
  updateProfile,
  changePassword,
    resendVerificationOTP,
  googleAuth,
  completeGoogleProfile,
  microsoftAuth
} = require('../controllers/authController');

const { protect } = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-verification-otp', resendVerificationOTP);
router.post('/login', login);

// Google Auth Endpoints
router.post('/google', googleAuth);
router.post('/complete-google-profile', completeGoogleProfile);

// Microsoft Auth Endpoint
router.post('/microsoft', microsoftAuth);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/profile/password', protect, changePassword);

module.exports = router;