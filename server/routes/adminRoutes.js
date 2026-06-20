const express = require('express');
const router = express.Router();
const { uploadQuestion, assignAdaptiveHomework, getAllStudents } = require('../controllers/adminController');

// FIXED: Added the 's' back to middlewares so it finds your folder!
const { protect, admin } = require('../middlewares/authMiddleware');

// All routes here require the user to be logged in AND be an admin
router.use(protect, admin); 

router.post('/questions', uploadQuestion);
router.post('/assign-homework', assignAdaptiveHomework);
router.get('/students', getAllStudents);

module.exports = router;