const express = require('express');
const router = express.Router();
const { createAnnouncement, getAdminAnnouncements, getStudentAnnouncements, markAsRead, deleteAnnouncement } = require('../controllers/announcementController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Admin Routes
router.post('/', protect, admin, createAnnouncement);
router.get('/admin', protect, admin, getAdminAnnouncements);
router.delete('/:id', protect, admin, deleteAnnouncement);

// Student Routes
router.get('/student', protect, getStudentAnnouncements);
router.put('/:id/read', protect, markAsRead);

module.exports = router;