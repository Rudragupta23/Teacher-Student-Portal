const express = require('express');
const router = express.Router();
const { 
  createClassSession, 
  getClassSessions, 
  deleteClassSession, 
  updateClassSession 
} = require('../controllers/classPlannerController');

router.post('/', createClassSession);
router.get('/', getClassSessions);
router.put('/:id', updateClassSession);
router.delete('/:id', deleteClassSession);

module.exports = router;