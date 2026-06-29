const express = require('express');
const router = express.Router();
const { createDriveLink, getDriveLinks, deleteDriveLink } = require('../controllers/driveController');
const { protect } = require('../middlewares/authMiddleware'); 

router.post('/', protect, createDriveLink);
router.get('/', protect, getDriveLinks);
router.delete('/:id', protect, deleteDriveLink);

module.exports = router;