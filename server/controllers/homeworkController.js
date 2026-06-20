const Homework = require('../models/Homework');
const User = require('../models/User');
const Question = require('../models/Question');
const sendEmail = require('../utils/sendEmail');

// @desc    Assign Adaptive Homework based on Filters
exports.assignHomework = async (req, res) => {
  const { title, description, studentId, topic, easyCount, mediumCount, hardCount, dueDate } = req.body;
  
  try {
    let targetStudents = [];
    if (studentId === 'all') {
      targetStudents = await User.find({ role: 'student' });
    } else {
      const student = await User.findById(studentId);
      if (student) targetStudents.push(student);
    }

    if (targetStudents.length === 0) {
      return res.status(404).json({ message: 'No students found! Ensure students are registered.' });
    }

    // ADAPTIVE ALGORITHM: Automatically pull random questions from the Question Bank based on your specified counts
    let selectedQuestions = [];
    if (topic) {
      const easyQs = await Question.aggregate([{ $match: { topic, difficulty: 'Easy' } }, { $sample: { size: Number(easyCount) || 0 } }]);
      const medQs = await Question.aggregate([{ $match: { topic, difficulty: 'Medium' } }, { $sample: { size: Number(mediumCount) || 0 } }]);
      const hardQs = await Question.aggregate([{ $match: { topic, difficulty: 'Hard' } }, { $sample: { size: Number(hardCount) || 0 } }]);
      selectedQuestions = [...easyQs, ...medQs, ...hardQs].map(q => q._id);
    }

    const homeworkPromises = targetStudents.map(student => 
      Homework.create({
        title,
        description,
        dueDate,
        questions: selectedQuestions,
        studentId: student._id, // Using _id for perfect DB matching
        adminId: req.user._id
      })
    );

    await Promise.all(homeworkPromises);
    res.status(201).json({ message: `Assigned ${selectedQuestions.length} questions to ${targetStudents.length} student(s)` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Student fetches ONLY their own homework
exports.getStudentHomework = async (req, res) => {
  try {
    const homeworks = await Homework.find({ studentId: req.user._id })
                                    .populate('questions') 
                                    .sort({ createdAt: -1 });
    res.status(200).json(homeworks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Student submits homework & Triggers Admin Email
exports.submitHomework = async (req, res) => {
  const { id } = req.params;
  const { answerText } = req.body;
  try {
    const homework = await Homework.findOneAndUpdate(
      { _id: id, studentId: req.user._id },
      { status: 'Submitted', submission: { answerText, submittedAt: new Date() } },
      { new: true }
    ).populate('studentId');

    // EMAIL ADMIN NOTIFICATION
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc;">
        <div style="background: white; padding: 30px; border-radius: 10px;">
          <h2 style="color: #4f46e5;">New Homework Submission! 📚</h2>
          <p><strong>Student:</strong> ${homework.studentId.name}</p>
          <p><strong>Assignment:</strong> ${homework.title}</p>
          <p>The student has successfully submitted their work. Please log in to your dashboard to review and grade it.</p>
        </div>
      </div>
    `;
    
    await sendEmail({
      email: process.env.ADMIN_EMAIL, 
      subject: `Submission Alert: ${homework.studentId.name} submitted work!`,
      html: adminEmailHtml
    });

    res.status(200).json({ message: 'Homework submitted successfully!', homework });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin gets all homeworks
exports.getAdminHomework = async (req, res) => {
  try {
    const homeworks = await Homework.find()
                                    .populate('studentId', 'name email')
                                    .populate('questions')
                                    .sort({ createdAt: -1 });
    res.status(200).json(homeworks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin grades homework -> Saves Permanent Score -> Deletes Task
exports.gradeHomework = async (req, res) => {
  const { id } = req.params;
  const { score, feedback, canDoEasy, canDoMedium, canDoHard } = req.body;
  try {
    const homework = await Homework.findById(id);
    if(!homework) return res.status(404).json({ message: 'Homework not found' });

    // 1. Save the Permanent Score and update the Adaptive Profile based on teacher's evaluation
    await User.findByIdAndUpdate(homework.studentId, {
      $push: { 
        performanceHistory: {
          assignmentTitle: homework.title,
          score: score,
          feedback: feedback,
          gradedAt: new Date()
        }
      },
      $set: { 
        'adaptiveProfile.canDoEasy': canDoEasy, 
        'adaptiveProfile.canDoMedium': canDoMedium, 
        'adaptiveProfile.canDoHard': canDoHard 
      }
    });

    // 2. Delete the homework task entirely from the active database
    await Homework.findByIdAndDelete(id);

    res.status(200).json({ message: 'Graded successfully! Score permanently saved and task deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};