// server/routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const { sendMessage, getConversation } = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');

// Both Admin and Student hit these routes
router.post('/', protect, sendMessage);

// 👇 FIXED: Split the optional parameter into two separate routes
router.get('/', protect, getConversation); 
router.get('/:otherUserId', protect, getConversation); 

module.exports = router;