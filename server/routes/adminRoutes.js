const express = require('express');
const router = express.Router();
// 🌟 ADDED deleteStudent to the import
const { uploadQuestion, assignAdaptiveHomework, getAllStudents, deleteStudent } = require('../controllers/adminController');

// FIXED: Added the 's' back to middlewares so it finds your folder!
const { protect, admin } = require('../middlewares/authMiddleware');

// All routes here require the user to be logged in AND be an admin
router.use(protect, admin); 

router.post('/questions', uploadQuestion);
router.post('/assign-homework', assignAdaptiveHomework);
router.get('/students', getAllStudents);

// 🌟 NEW: Route to handle deleting a student
router.delete('/students/:id', deleteStudent);

module.exports = router;