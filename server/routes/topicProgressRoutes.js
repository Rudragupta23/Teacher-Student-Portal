const express = require('express');
const router = express.Router();

// Import all functions in one single line
const { getTopics, createTopic, deleteTopic, updateTopic } = require('../controllers/topicProgressController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(protect, getTopics).post(protect, createTopic);
router.route('/:id').delete(protect, deleteTopic).put(protect, updateTopic);

module.exports = router;