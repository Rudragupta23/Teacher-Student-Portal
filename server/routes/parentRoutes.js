const express = require('express');
const router = express.Router();
const { getChildData } = require('../controllers/parentController');
const { protect } = require('../middlewares/authMiddleware');

// Ensure only parents can access this
router.get('/child-data', protect, (req, res, next) => {
  if (req.user.role !== 'parent') return res.status(403).json({ message: 'Access denied' });
  next();
}, getChildData);

module.exports = router;