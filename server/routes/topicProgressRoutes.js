const express = require('express');
const router = express.Router();

const { getTopics, createTopic, deleteTopic, updateTopic, bulkCreateTopics, deleteAllTopics } = require('../controllers/topicProgressController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(protect, getTopics).post(protect, createTopic).delete(protect, deleteAllTopics);
router.route('/bulk').post(protect, bulkCreateTopics);
router.route('/:id').delete(protect, deleteTopic).put(protect, updateTopic);

module.exports = router;