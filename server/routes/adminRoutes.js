// const express = require('express');
// const router = express.Router();
// const { uploadQuestion, assignAdaptiveHomework, getAllStudents, deleteStudent } = require('../controllers/adminController');

// const { protect, admin } = require('../middlewares/authMiddleware');

// router.use(protect, admin); 

// router.post('/questions', uploadQuestion);
// router.post('/assign-homework', assignAdaptiveHomework);
// router.get('/students', getAllStudents);
// // Get a student's linked parent
// router.get('/student/:id/parent', protect, async (req, res) => {
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

// module.exports = router;
const express = require('express');
const router = express.Router();
const { 
  uploadQuestion, 
  assignAdaptiveHomework, 
  getAllStudents, 
  deleteStudent,
  createGrader,     // <-- NEW IMPORT
  getGraders,       // <-- NEW IMPORT
  deleteGrader      // <-- NEW IMPORT
} = require('../controllers/adminController');

const { protect, admin } = require('../middlewares/authMiddleware');

// This applies 'protect' and 'admin' middleware to ALL routes in this file
router.use(protect, admin); 

router.post('/questions', uploadQuestion);
router.post('/assign-homework', assignAdaptiveHomework);
router.get('/students', getAllStudents);

// Get a student's linked parent
router.get('/student/:id/parent', async (req, res) => {
  try {
    const User = require('../models/User');
    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const parent = await User.findOne({ role: 'parent', linkedStudentId: student.studentId });
    if (!parent) return res.status(404).json({ message: "No parent linked to this student yet." });
    
    res.json(parent);
  } catch(e) { 
    res.status(500).json({ error: e.message });
  }
});

router.delete('/students/:id', deleteStudent);

// --- NEW GRADER ROUTES ---
router.post('/graders', createGrader);
router.get('/graders', getGraders);
router.delete('/graders/:id', deleteGrader);

module.exports = router;