const express = require('express');
const router = express.Router();
const { uploadQuestion, assignAdaptiveHomework, getAllStudents } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// All routes here require the user to be logged in AND be an admin
router.use(protect, adminOnly); 

router.post('/questions', uploadQuestion);
router.post('/assign-homework', assignAdaptiveHomework);
router.get('/students', getAllStudents);

module.exports = router;