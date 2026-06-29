// const express = require('express');
// const router = express.Router();
// const { 
//   uploadQuestion, 
//   assignAdaptiveHomework, 
//   getAllStudents, 
//   deleteStudent,
//   createGrader,     
//   getGraders,       
//   deleteGrader,
//   allocateStudentsToGrader      
// } = require('../controllers/adminController');

// const { protect, admin } = require('../middlewares/authMiddleware');

// // This applies 'protect' and 'admin' middleware to ALL routes in this file
// router.use(protect, admin); 

// router.post('/questions', uploadQuestion);
// router.post('/assign-homework', assignAdaptiveHomework);
// router.get('/students', getAllStudents);

// // Get a student's linked parent
// router.get('/student/:id/parent', async (req, res) => {
//   try {
//     const User = require('../models/User');
//     const student = await User.findById(req.params.id);
//     if (!student) return res.status(404).json({ message: "Student not found" });

//     const parent = await User.findOne({ role: 'parent', linkedStudentId: student.studentId });
//     if (!parent) return res.status(404).json({ message: "No parent linked to this student yet." });
    
//     res.json(parent);
//   } catch(e) { 
//     res.status(500).json({ error: e.message });
//   }
// });

// router.delete('/students/:id', deleteStudent);

// // --- NEW GRADER ROUTES ---
// router.post('/graders', createGrader);
// router.get('/graders', getGraders);
// router.delete('/graders/:id', deleteGrader);
// router.put('/graders/:id/allocate', allocateStudentsToGrader);

// module.exports = router;
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Required for the inline parent route
const { 
  uploadQuestion, 
  assignAdaptiveHomework, 
  getAllStudents, 
  deleteStudent,
  createGrader,     
  getGraders,       
  deleteGrader,
  allocateStudentsToGrader      
} = require('../controllers/adminController');

// Import graderOrAdmin alongside protect and admin
const { protect, admin, graderOrAdmin } = require('../middlewares/authMiddleware');

// === ADMIN ONLY ROUTES ===
router.post('/questions', protect, admin, uploadQuestion);
router.post('/assign-homework', protect, admin, assignAdaptiveHomework);
router.delete('/students/:id', protect, admin, deleteStudent);

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
// Allows both Admins and Graders to fetch their respective student lists
router.get('/students', protect, graderOrAdmin, getAllStudents);

module.exports = router;