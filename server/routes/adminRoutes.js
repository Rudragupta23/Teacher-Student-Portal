const express = require('express');
const router = express.Router();
const { uploadQuestion, assignAdaptiveHomework, getAllStudents, deleteStudent } = require('../controllers/adminController');

const { protect, admin } = require('../middlewares/authMiddleware');

router.use(protect, admin); 

router.post('/questions', uploadQuestion);
router.post('/assign-homework', assignAdaptiveHomework);
router.get('/students', getAllStudents);

router.delete('/students/:id', deleteStudent);

module.exports = router;