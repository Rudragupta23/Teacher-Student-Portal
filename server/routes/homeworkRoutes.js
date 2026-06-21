const express = require('express');
const router = express.Router();
const { 
  assignHomework, 
  getStudentHomework, 
  submitHomework, 
  getAdminHomework, 
  gradeHomework,
  extendDeadline,
  deleteHomework // <-- ADD THIS
} = require('../controllers/homeworkController');

const { protect } = require('../middlewares/authMiddleware'); 

// Admin Routes
router.post('/assign', protect, assignHomework);
router.get('/admin', protect, getAdminHomework);
router.put('/:id/grade', protect, gradeHomework);
router.put('/:id/extend', protect, extendDeadline);
router.delete('/:id', protect, deleteHomework); // <-- NEW DELETE ROUTE

// Student Routes
router.get('/student', protect, getStudentHomework);
router.post('/:id/submit', protect, submitHomework);

module.exports = router;