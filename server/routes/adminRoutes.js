const express = require('express');
const router = express.Router();
const { uploadQuestion, assignAdaptiveHomework, getAllStudents, deleteStudent } = require('../controllers/adminController');

const { protect, admin } = require('../middlewares/authMiddleware');

router.use(protect, admin); 

router.post('/questions', uploadQuestion);
router.post('/assign-homework', assignAdaptiveHomework);
router.get('/students', getAllStudents);
// Get a student's linked parent
router.get('/student/:id/parent', protect, async (req, res) => {
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

module.exports = router;