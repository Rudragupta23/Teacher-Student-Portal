const express = require('express');
const router = express.Router();
const { register, login, verifyOTP, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);

// New Routes for Password Reset
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;