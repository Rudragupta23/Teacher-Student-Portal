const Homework = require('../models/Homework');
const User = require('../models/User');

// @desc    Assign homework to one or all students
exports.assignHomework = async (req, res) => {
  const { title, description, studentId, difficulty, dueDate } = req.body;
  try {
    let targetStudents = [];
    
    if (studentId === 'all') {
      targetStudents = await User.find({ role: 'student' });
    } else {
      const student = await User.findById(studentId);
      if (student) targetStudents.push(student);
    }

    if (targetStudents.length === 0) return res.status(404).json({ message: 'No students found' });

    const homeworkPromises = targetStudents.map(student => 
      Homework.create({
        title,
        description,
        difficulty,
        dueDate,
        studentId: student._id,
        adminId: req.user.id // Requires auth middleware
      })
    );

    await Promise.all(homeworkPromises);
    res.status(201).json({ message: `Homework assigned to ${targetStudents.length} student(s)` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all homeworks for the logged-in student
exports.getStudentHomework = async (req, res) => {
  try {
    const homeworks = await Homework.find({ studentId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(homeworks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Student submits homework
exports.submitHomework = async (req, res) => {
  const { id } = req.params;
  const { answerText } = req.body;
  try {
    const homework = await Homework.findOneAndUpdate(
      { _id: id, studentId: req.user.id },
      { 
        status: 'Submitted',
        submission: { answerText, submittedAt: new Date() }
      },
      { new: true }
    );
    res.status(200).json({ message: 'Homework submitted successfully!', homework });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin gets all homeworks (to see submissions)
exports.getAdminHomework = async (req, res) => {
  try {
    const homeworks = await Homework.find().populate('studentId', 'name email').sort({ createdAt: -1 });
    res.status(200).json(homeworks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin grades homework and sets adaptive profile
exports.gradeHomework = async (req, res) => {
  const { id } = req.params;
  const { score, canDoEasy, canDoMedium, canDoHard, feedback } = req.body;
  try {
    const homework = await Homework.findByIdAndUpdate(
      id,
      {
        status: 'Graded',
        grading: { score, canDoEasy, canDoMedium, canDoHard, feedback }
      },
      { new: true }
    );
    res.status(200).json({ message: 'Graded successfully! Adaptive profile updated.', homework });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};