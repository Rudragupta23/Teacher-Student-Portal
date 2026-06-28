const express = require('express');
const router = express.Router();
const { 
  assignHomework, 
  getStudentHomework, 
  submitHomework, 
  getAdminHomework, 
  gradeHomework,
  extendDeadline,
  deleteHomework
} = require('../controllers/homeworkController');

const { protect, admin, graderOrAdmin } = require('../middlewares/authMiddleware');
// Admin Routes
router.post('/assign', protect, graderOrAdmin, assignHomework);
router.get('/admin', protect, graderOrAdmin, getAdminHomework);
router.put('/:id/grade', protect, graderOrAdmin, gradeHomework);
router.put('/:id/extend', protect, extendDeadline);
router.delete('/:id', protect, admin, deleteHomework);

// Student Routes
router.get('/student', protect, getStudentHomework);
router.post('/:id/submit', protect, submitHomework);

module.exports = router;