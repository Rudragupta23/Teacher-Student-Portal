const express = require('express');
const router = express.Router();
const { assignHomework, getStudentHomework, submitHomework, getAdminHomework, gradeHomework } = require('../controllers/homeworkController');

// FIXED: Added the 's' back to middlewares!
const { protect } = require('../middlewares/authMiddleware'); 

router.post('/assign', protect, assignHomework);
router.get('/student', protect, getStudentHomework);
router.post('/submit/:id', protect, submitHomework);
router.get('/admin', protect, getAdminHomework);
router.post('/grade/:id', protect, gradeHomework);

module.exports = router;