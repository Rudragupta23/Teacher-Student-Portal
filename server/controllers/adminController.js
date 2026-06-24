const Question = require('../models/Question');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Homework = require('../models/Homework'); 

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

    if (!student.performance.canDoEasy) {
      easyCount = Math.floor(totalQuestions * 0.8);
      mediumCount = totalQuestions - easyCount;
    } else if (!student.performance.canDoMedium) {
      easyCount = Math.floor(totalQuestions * 0.2);
      mediumCount = Math.floor(totalQuestions * 0.6);
      hardCount = totalQuestions - easyCount - mediumCount;
    } else {
      mediumCount = Math.floor(totalQuestions * 0.3);
      hardCount = totalQuestions - mediumCount;
    }

    const easyQs = await Question.aggregate([{ $match: { difficulty: 'easy', topic, qualification } }, { $sample: { size: easyCount } }]);
    const mediumQs = await Question.aggregate([{ $match: { difficulty: 'medium', topic, qualification } }, { $sample: { size: mediumCount } }]);
    const hardQs = await Question.aggregate([{ $match: { difficulty: 'hard', topic, qualification } }, { $sample: { size: hardCount } }]);

    const assignedQuestionIds = [...easyQs, ...mediumQs, ...hardQs].map(q => q._id);

    if (assignedQuestionIds.length === 0) {
      return res.status(400).json({ message: 'Not enough questions in the bank for this topic.' });
    }

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

// @desc    Delete a student, their parent, and their coursework
// @route   DELETE /api/admin/students/:id
exports.deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // 1. Delete all homework assigned to this student to free up database space
    await Homework.deleteMany({ studentId: studentId });

    // 2. NEW: Delete the linked parent account
    // We check if they have a studentId (like "MCM-Y9-01") and find the matching parent
    if (student.role === 'student' && student.studentId) {
      await User.findOneAndDelete({ 
        role: 'parent', 
        linkedStudentId: student.studentId 
      });
    }

    // 3. Delete the student account
    await User.findByIdAndDelete(studentId);

    res.status(200).json({ message: 'Student, linked parent, and all associated coursework deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};