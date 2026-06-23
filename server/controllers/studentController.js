const Assignment = require('../models/Assignment');

// @desc    Get all assignments for the logged-in student
// @route   GET /api/student/assignments
exports.getMyAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ studentId: req.user.id })
      .populate('questions', '-correctAnswer') 
      .sort({ dueDate: 1 }); 

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Submit homework answers
// @route   POST /api/student/assignments/:id/submit
exports.submitAssignment = async (req, res) => {
  const { studentAnswers } = req.body; 

  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, studentId: req.user.id });
    
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    if (assignment.status !== 'pending') return res.status(400).json({ message: 'Assignment already submitted' });

    assignment.studentAnswers = studentAnswers;
    assignment.status = 'submitted';
    
    await assignment.save();
    
    res.status(200).json({ message: 'Homework submitted successfully!', assignment });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};