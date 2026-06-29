const express = require('express');
const router = express.Router();
const { createReport, getReports } = require('../controllers/schemeController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/', protect, getReports);
router.post('/', protect, admin, createReport);

module.exports = router;