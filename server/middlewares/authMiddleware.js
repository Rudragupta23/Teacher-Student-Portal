const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. Protect Middleware (Checks if user is logged in)
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await User.findById(decoded.id).select('-password');
      next(); 
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// 2. Admin Middleware (Checks if the logged-in user is an Admin)
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // User is admin, let them proceed
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};