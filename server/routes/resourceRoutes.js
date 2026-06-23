// server/routes/resourceRoutes.js
const express = require('express');
const router = express.Router();
const { createResource, getResources, deleteResource } = require('../controllers/resourceController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.post('/', protect, admin, createResource);
router.get('/', protect, getResources); // Accessible to both roles
router.delete('/:id', protect, admin, deleteResource);

module.exports = router;