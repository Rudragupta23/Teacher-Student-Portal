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

    const allHomework = await Homework.find({}).lean();
    
    const childAssignments = allHomework.filter(hw => {
      const isGlobal = hw.studentId === 'all' || hw.assignTo === 'all';
      const isForChild = hw.studentId && hw.studentId.toString() === child._id.toString();
      
      return isGlobal || isForChild;
    });

    res.status(200).json({
      childProfile: { 
        _id: child._id,             
        id: child._id,               
        email: child.email,          
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
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};