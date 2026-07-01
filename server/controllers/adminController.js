const Question = require('../models/Question');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const Homework = require('../models/Homework'); 
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');

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

// @desc    Get all registered students for the admin/grader to view
// @route   GET /api/admin/students
exports.getAllStudents = async (req, res) => {
  try {
    // If the user is a grader, return ONLY their allocated students
    if (req.user.role === 'grader') {
      const grader = await User.findById(req.user._id).populate('allocatedStudents', '-password');
      return res.status(200).json(grader.allocatedStudents);
    }
    
    // Otherwise, they are an admin, return ALL students
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

// @desc    Create a Grader
// @route   POST /api/admin/graders
exports.createGrader = async (req, res) => {
  try {
    const { email, name } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // Generate password like MCM-Grader-XXXX
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const plainPassword = `MCM-Grader-${randomNum}`;
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const grader = await User.create({
      name: name || 'Grader Admin',
      email,
      password: hashedPassword,
      role: 'grader',
      isVerified: true // Auto-verify graders
    });

    // Send email to grader
    // Send email to grader (Professionally Styled)
    await sendEmail({
      email,
      subject: 'Welcome to MathCom Mentors | Grader Account Credentials',
      html: `
        <div style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px; border-radius: 24px; border: 1px solid #e2e8f0;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0f172a; font-size: 28px; font-weight: 800; margin: 0;">
              MathCom <span style="color: #4f46e5;">Mentors</span>
            </h1>
            <p style="color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin-top: 8px;">Base Admin Portal</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 32px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); border: 1px solid #f1f5f9;">
            <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Hello Grader,</h2>
            <p style="color: #334155; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
              You have been officially added as a Grader (Base Administrator) for the MathCom Mentors platform. Your account is verified and ready for use.
            </p>
            
            <div style="background-color: #f1f5f9; padding: 20px 24px; border-radius: 16px; margin-bottom: 24px; border-left: 4px solid #4f46e5;">
              <p style="margin: 0 0 10px 0; color: #475569; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Login Credentials</p>
              <p style="margin: 4px 0; color: #0f172a; font-size: 16px;"><strong>Email:</strong> <span style="color: #475569;">${email}</span></p>
              <p style="margin: 4px 0; color: #0f172a; font-size: 16px;"><strong>Password:</strong> <span style="font-family: monospace; font-weight: bold; background-color: #e2e8f0; padding: 2px 6px; border-radius: 6px; color: #4f46e5;">${plainPassword}</span></p>
            </div>
          </div>

          <div style="text-align: center; margin-top: 32px; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">MathCom Mentors • 2026</p>
          </div>
        </div>
      `
    });

    res.status(201).json({ message: 'Grader created successfully!', grader });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all Graders
// @route   GET /api/admin/graders
exports.getGraders = async (req, res) => {
  try {
    const graders = await User.find({ role: 'grader' }).select('-password').populate('allocatedStudents', 'name registrationName yearGroup');
    res.status(200).json(graders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a Grader
// @route   DELETE /api/admin/graders/:id
exports.deleteGrader = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Grader deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
// @desc    Allocate specific students to a grader
// @route   PUT /api/admin/graders/:id/allocate
exports.allocateStudentsToGrader = async (req, res) => {
  try {
    const { studentIds } = req.body;
    const grader = await User.findById(req.params.id);
    if (!grader || grader.role !== 'grader') return res.status(404).json({ message: 'Grader not found' });
    
    grader.allocatedStudents = studentIds;
    await grader.save();
    res.status(200).json({ message: 'Students successfully allocated to grader!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get all students waiting for approval
// @route   GET /api/admin/students/pending
exports.getPendingStudents = async (req, res) => {
  try {
    const pendingStudents = await User.find({ role: 'student', status: 'pending' }).select('-password');
    res.status(200).json(pendingStudents);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Approve a pending student
// @route   PUT /api/admin/students/:id/approve
exports.approveStudent = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { returnDocument: 'after' }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'Student not found' });

    const studentApprovalHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px; border-radius: 16px;">
        <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
          <h2 style="color: #10B981; margin-top: 0; font-size: 28px; font-weight: 800;">Account Approved! 🎉</h2>
          <h3 style="color: #1e293b; font-size: 22px; margin-bottom: 16px;">Welcome to MathCom Mentors, ${user.name}.</h3>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Great news! Your teacher has reviewed and approved your registration. 
          </p>
          
          <div style="background-color: #ecfdf5; border: 1px solid #d1fae5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #047857; font-size: 15px; font-weight: 600; margin: 0;">
              Your account is now fully active.
            </p>
          </div>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          
          <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">
            You can now log in to the portal at any time using your registered email and password to view your dashboard, assignments, and study materials.
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      email: user.email, 
      subject: 'Account Approved! Welcome to MathCom Mentors',
      html: studentApprovalHtml
    });

    res.status(200).json({ message: 'Student approved successfully!', user });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};