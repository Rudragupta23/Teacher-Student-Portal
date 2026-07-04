const express = require('express');
const router = express.Router();
const { createClassSession, getClassSessions, deleteClassSession } = require('../controllers/classPlannerController');

router.post('/', createClassSession);
router.get('/', getClassSessions);
router.delete('/:id', deleteClassSession);

module.exports = router;