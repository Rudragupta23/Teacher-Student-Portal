const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); 
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};
exports.graderOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'grader' || req.user.role === 'admin')) {
    next(); 
  } else {
    res.status(403).json({ message: 'Not authorized as a grader or admin' });
  }
};