const express = require('express');
const router = express.Router();
const { submitFeedback, getAllFeedback, deleteFeedback, markReviewed } = require('../controllers/feedbackController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/', protect, submitFeedback);
router.get('/', protect, admin, getAllFeedback);
router.put('/:id/review', protect, admin, markReviewed); 
router.delete('/:id', protect, admin, deleteFeedback);

module.exports = router;