const express = require('express');
const router = express.Router();
const { sendMessage, getConversation } = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, sendMessage);

router.get('/', protect, getConversation); 
router.get('/:otherUserId', protect, getConversation); 

module.exports = router;