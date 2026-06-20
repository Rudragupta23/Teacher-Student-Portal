const Homework = require('../models/Homework');
const Question = require('../models/Question');
const User = require('../models/User');

exports.assignHomework = async (req, res) => {
  const { studentIds, topic, totalQuestions, difficultyRatio } = req.body; 
  // difficultyRatio could be { easy: 8, medium: 2, hard: 0 }

  try {
    // 1. Fetch questions based on filters
    const easyQs = await Question.find({ topic, difficulty: 'Easy' }).limit(difficultyRatio.easy);
    const medQs = await Question.find({ topic, difficulty: 'Medium' }).limit(difficultyRatio.medium);
    const selectedQuestions = [...easyQs, ...medQs].map(q => q._id);

    // 2. Assign to either a specific student or all students
    const students = studentIds === 'all' ? await User.find({ role: 'student' }) : studentIds;

    const homeworkPromises = students.map(student => 
      Homework.create({
        studentId: student._id || student,
        adminId: req.user.id,
        questions: selectedQuestions,
        dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
      })
    );

    await Promise.all(homeworkPromises);
    res.status(200).json({ message: 'Homework assigned successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};