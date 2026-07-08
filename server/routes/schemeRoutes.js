const express = require('express');
const router = express.Router();
const { createReport, getReports, deleteReport, deleteAllReports } = require('../controllers/schemeController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/', protect, getReports);
router.post('/', protect, admin, createReport);
router.delete('/:id', protect, admin, deleteReport);
router.delete('/', protect, admin, deleteAllReports);

module.exports = router;