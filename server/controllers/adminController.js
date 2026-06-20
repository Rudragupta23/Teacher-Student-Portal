const Question = require('../models/Question');
const Assignment = require('../models/Assignment');
const User = require('../models/User');

// @desc    Upload a single question to the Question Bank
// @route   POST /api/admin/questions
exports.uploadQuestion = async (req, res) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json({ message: 'Question added to bank', question });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Auto-generate & Assign Adaptive Homework
// @route   POST /api/admin/assign-homework
exports.assignAdaptiveHomework = async (req, res) => {
  const { studentId, qualification, chapter, topic, totalQuestions, durationHours } = req.body;

  try {
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    let easyCount = 0, mediumCount = 0, hardCount = 0;

    // YOUR ADAPTIVE ALGORITHM:
    // If student hasn't mastered easy yet: mostly easy, some medium
    if (!student.performance.canDoEasy) {
      easyCount = Math.floor(totalQuestions * 0.8); // 80% easy
      mediumCount = totalQuestions - easyCount;     // 20% medium
    } 
    // If mastered easy, but not medium: mix of all three
    else if (student.performance.canDoEasy && !student.performance.canDoMedium) {
      easyCount = Math.floor(totalQuestions * 0.3); // 30% easy
      mediumCount = Math.floor(totalQuestions * 0.6); // 60% medium
      hardCount = totalQuestions - (easyCount + mediumCount); // 10% hard
    } 
    // If mastered medium: mostly hard, some medium
    else {
      mediumCount = Math.floor(totalQuestions * 0.4); // 40% medium
      hardCount = totalQuestions - mediumCount;       // 60% hard
    }

    // Fetch random questions from the database matching the criteria
    const easyQs = await Question.aggregate([{ $match: { difficulty: 'easy', topic, qualification } }, { $sample: { size: easyCount } }]);
    const mediumQs = await Question.aggregate([{ $match: { difficulty: 'medium', topic, qualification } }, { $sample: { size: mediumCount } }]);
    const hardQs = await Question.aggregate([{ $match: { difficulty: 'hard', topic, qualification } }, { $sample: { size: hardCount } }]);

    const assignedQuestionIds = [...easyQs, ...mediumQs, ...hardQs].map(q => q._id);

    if (assignedQuestionIds.length === 0) {
      return res.status(400).json({ message: 'Not enough questions in the bank for this topic.' });
    }

    // Create the assignment
    const dueDate = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    
    const assignment = await Assignment.create({
      studentId,
      questions: assignedQuestionIds,
      dueDate
    });

    res.status(201).json({ message: `Assigned ${assignedQuestionIds.length} questions to ${student.name}`, assignment });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all registered students for the admin to view
// @route   GET /api/admin/students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};