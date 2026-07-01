const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const { 
  uploadQuestion, 
  assignAdaptiveHomework, 
  getAllStudents, 
  deleteStudent,
  createGrader,     
  getGraders,       
  deleteGrader,
  allocateStudentsToGrader,
  getPendingStudents, 
  approveStudent      
} = require('../controllers/adminController');

// Import graderOrAdmin alongside protect and admin
const { protect, admin, graderOrAdmin } = require('../middlewares/authMiddleware');

// ADMIN ONLY ROUTES
router.post('/questions', protect, admin, uploadQuestion);
router.post('/assign-homework', protect, admin, assignAdaptiveHomework);
router.delete('/students/:id', protect, admin, deleteStudent);
router.get('/students/pending', protect, admin, getPendingStudents);
router.put('/students/:id/approve', protect, admin, approveStudent);

// Grader Management (Admin Only)
router.post('/graders', protect, admin, createGrader);
router.get('/graders', protect, admin, getGraders);
router.delete('/graders/:id', protect, admin, deleteGrader);
router.put('/graders/:id/allocate', protect, admin, allocateStudentsToGrader);

// Get Parent (Admin Only)
router.get('/student/:id/parent', protect, admin, async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const parent = await User.findOne({ role: 'parent', linkedStudentId: student.studentId });
    if (!parent) return res.status(404).json({ message: "No parent linked to this student yet." });
    
    res.json(parent);
  } catch(e) { 
    res.status(500).json({ error: e.message });
  }
});

// === GRADER OR ADMIN ROUTES ===
router.get('/students', protect, graderOrAdmin, getAllStudents);

module.exports = router;