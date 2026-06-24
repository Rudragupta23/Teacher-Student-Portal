// const User = require('../models/User');
// const Homework = require('../models/Homework');

// // @desc    Get linked child's profile and grades
// // @route   GET /api/parent/child-data
// exports.getChildData = async (req, res) => {
//   try {
//     const parent = await User.findById(req.user._id);
//     if (!parent || !parent.linkedStudentId) {
//       return res.status(400).json({ message: 'No linked student found.' });
//     }

//     const child = await User.findOne({ studentId: parent.linkedStudentId, role: 'student' });
//     if (!child) {
//       return res.status(404).json({ message: 'Child profile not found.' });
//     }

//     const assignments = await Homework.find({
//       $or: [
//         { assignTo: 'all' },
//         { assignTo: child.classCode },
//         { assignTo: child.yearGroup }
//       ]
//     }).lean();

//     const childAssignments = assignments.map(hw => {
//       const submission = hw.submissions.find(sub => sub.student.toString() === child._id.toString());
//       return {
//         _id: hw._id,
//         title: hw.title,
//         dueDate: hw.dueDate,
//         difficulty: hw.difficulty,
//         status: submission ? submission.status : 'Pending',
//         grading: submission ? submission.grading : null
//       };
//     });

//     res.status(200).json({
//       // ADDED REGISTRATION NAME AND STUDENT ID HERE
//       childProfile: { 
//         name: child.name, 
//         registrationName: child.registrationName || child.name, 
//         studentId: child.studentId, 
//         yearGroup: child.yearGroup, 
//         classCode: child.classCode 
//       },
//       assignments: childAssignments
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Server Error', error: error.message });
//   } 
// };

const User = require('../models/User');
const Homework = require('../models/Homework');

// @desc    Get linked child's profile and grades
// @route   GET /api/parent/child-data
exports.getChildData = async (req, res) => {
  try {
    const parent = await User.findById(req.user._id);
    if (!parent || !parent.linkedStudentId) {
      return res.status(400).json({ message: 'No linked student found.' });
    }

    const child = await User.findOne({ studentId: parent.linkedStudentId, role: 'student' });
    if (!child) {
      return res.status(404).json({ message: 'Child profile not found.' });
    }

    // 🌟 BULLETPROOF FIX: Fetch everything raw, and filter it safely in JavaScript.
    // This completely bypasses Mongoose crashing over "ObjectId vs String" rules.
    const allHomework = await Homework.find({}).lean();
    
    const childAssignments = allHomework.filter(hw => {
      // Safely check if it belongs to everyone, or specifically to this child
      const isGlobal = hw.studentId === 'all' || hw.assignTo === 'all';
      const isForChild = hw.studentId && hw.studentId.toString() === child._id.toString();
      
      return isGlobal || isForChild;
    });

    res.status(200).json({
      childProfile: { 
        name: child.name, 
        registrationName: child.registrationName || child.name, 
        studentId: child.studentId, 
        yearGroup: child.yearGroup, 
        classCode: child.classCode 
      },
      assignments: childAssignments
    });
  } catch (error) {
    console.error("Parent Controller Error:", error);
    // 🚨 Now, if it crashes, it will send the EXACT reason to your frontend toast!
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};