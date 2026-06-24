const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');

// Define both routes separately to avoid the "path-to-regexp" syntax error
// Admin uses /:id (e.g., /api/messages/12345), Parents/Students use the base / route
router.get('/', protect, getMessages); 
router.get('/:id', protect, getMessages); 

router.post('/', protect, sendMessage);

module.exports = router;