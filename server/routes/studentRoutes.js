const express = require('express');
const router = express.Router();
const { getMyAssignments, submitAssignment } = require('../controllers/studentController');
const { protect } = require('../middlewares/authMiddleware');

// Students must be logged in to access these routes
router.use(protect);

router.get('/assignments', getMyAssignments);
router.post('/assignments/:id/submit', submitAssignment);

module.exports = router;