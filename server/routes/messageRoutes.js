const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middlewares/authMiddleware');

// The "/:id?" means the ID is optional. 
// Admin passes an ID, Parent/Student do not.
router.get('/:id?', protect, getMessages); 
router.post('/', protect, sendMessage);

module.exports = router;