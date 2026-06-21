// server/controllers/homeworkController.js
const Homework = require('../models/Homework');
const User = require('../models/User');

// 1. Assign Work (Handles Direct Due Date, Text, File, and MCQ Formats)
exports.assignHomework = async (req, res) => {
  const { title, description, type, studentId, difficulty, dueDate, fileUrl, content, mcqs } = req.body;
  
  try {
    let targetStudents = [];
    
    // Check if assigned to all or a specific student
    if (studentId === 'all') {
      targetStudents = await User.find({ role: 'student' });
    } else {
      const student = await User.findById(studentId);
      if (student) targetStudents.push(student);
    }

    if (targetStudents.length === 0) return res.status(404).json({ message: 'No students found!' });

    // Validate the due date is in the future
    if (new Date(dueDate) <= new Date()) {
      return res.status(400).json({ message: 'Due date must be in the future!' });
    }

    const homeworkPromises = targetStudents.map(student => 
      Homework.create({
        title, 
        description, 
        type, 
        difficulty,
        fileUrl: type === 'File' ? fileUrl : undefined,
        content: type === 'Text' ? content : undefined,
        mcqs: type === 'MCQ' ? mcqs : [],
        dueDate: new Date(dueDate),
        studentId: student._id,
        adminId: req.user._id
      })
    );

    await Promise.all(homeworkPromises);
    res.status(201).json({ message: `Successfully assigned to ${targetStudents.length} student(s)` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Admin: Get all homeworks for the dashboard
exports.getAdminHomework = async (req, res) => {
  try {
    const homeworks = await Homework.find()
                                    .populate('studentId', 'name email') // Gets student details
                                    .sort({ createdAt: -1 }); // Newest first
    res.status(200).json(homeworks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Student: Get ONLY their own homework
exports.getStudentHomework = async (req, res) => {
  try {
    const homeworks = await Homework.find({ studentId: req.user._id })
                                    .sort({ createdAt: -1 });
    res.status(200).json(homeworks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Student: Submit Homework (With Late Block & Auto-grade MCQ)
exports.submitHomework = async (req, res) => {
  const { id } = req.params;
  const { answerText, answerFileUrl, mcqAnswers } = req.body;
  
  try {
    const homework = await Homework.findOne({ _id: id, studentId: req.user._id });
    if (!homework) return res.status(404).json({ message: 'Homework not found' });

    // Block submission if deadline is missed
    if (new Date() > new Date(homework.dueDate)) {
      return res.status(403).json({ message: 'You are late! The deadline has passed. Please contact your teacher to extend the duration.' });
    }

    // 🌟 Auto-grade if it's an MCQ Assignment
    if (homework.type === 'MCQ') {
      let correctCount = 0;
      const totalQuestions = homework.mcqs.length;

      // Check answers
      homework.mcqs.forEach((mcq, idx) => {
        if (mcqAnswers && parseInt(mcqAnswers[idx]) === mcq.correctOption) {
          correctCount++;
        }
      });

      const score = Math.round((correctCount / totalQuestions) * 100);

      // Auto-publish grade and delete content
      homework.status = 'Graded';
      homework.grading = { score, feedback: 'Auto-graded MCQ Submission', gradedAt: new Date() };
      homework.submission = { submittedAt: new Date() };
      homework.mcqs = []; 
      
      await homework.save();
      return res.status(200).json({ message: 'MCQ auto-graded successfully!', homework });
    }

    // Standard File/Text Submission
    homework.status = 'Submitted';
    homework.submission = { answerText, answerFileUrl, submittedAt: new Date() };
    await homework.save();

    res.status(200).json({ message: 'Homework submitted successfully!', homework });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Admin: Grades & Uploads Answer Sheet
exports.gradeHomework = async (req, res) => {
  const { id } = req.params;
  const { score, feedback, adminAnswerSheetUrl } = req.body;
  
  try {
    const homework = await Homework.findById(id);
    if (!homework) return res.status(404).json({ message: 'Homework not found' });

    homework.status = 'Graded';
    homework.grading = { score, feedback, adminAnswerSheetUrl, gradedAt: new Date() };
    
    // NEW ADDITION: Delete the original assigned work when grading is published
    homework.fileUrl = undefined;
    homework.content = undefined;
    homework.mcqs = [];

    await homework.save();

    res.status(200).json({ message: 'Graded successfully! Answer sheet uploaded.', homework });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Admin: Extends Deadline (UPDATED TO USE REAL DATES)
exports.extendDeadline = async (req, res) => {
  const { id } = req.params;
  const { newDueDate } = req.body; // Now expects a direct date from the calendar

  try {
    const homework = await Homework.findById(id);
    if (!homework) return res.status(404).json({ message: 'Homework not found' });

    // Validate the new due date is in the future
    if (new Date(newDueDate) <= new Date()) {
      return res.status(400).json({ message: 'New due date must be in the future!' });
    }

    homework.dueDate = new Date(newDueDate);
    
    // If student was stuck, keep it pending so they can submit again
    if (homework.status !== 'Graded') homework.status = 'Pending';
    
    await homework.save();
    res.status(200).json({ message: 'Deadline extended successfully!', homework });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Feature 7: Admin Deletes an Assignment
exports.deleteHomework = async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id);
    if (!homework) return res.status(404).json({ message: 'Homework not found' });

    await Homework.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Assignment permanently deleted.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};