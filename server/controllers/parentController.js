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

    // Find the child
    const child = await User.findOne({ studentId: parent.linkedStudentId, role: 'student' });
    if (!child) {
      return res.status(404).json({ message: 'Child profile not found.' });
    }

    // Find all homework assigned to this child's class/year
    const assignments = await Homework.find({
      $or: [
        { assignTo: 'all' },
        { assignTo: child.classCode },
        { assignTo: child.yearGroup }
      ]
    }).lean();

    // Format assignments to only show child's submissions and grades
    const childAssignments = assignments.map(hw => {
      const submission = hw.submissions.find(sub => sub.student.toString() === child._id.toString());
      return {
        _id: hw._id,
        title: hw.title,
        dueDate: hw.dueDate,
        difficulty: hw.difficulty,
        status: submission ? submission.status : 'Pending',
        grading: submission ? submission.grading : null
      };
    });

    res.status(200).json({
      childProfile: { name: child.name, yearGroup: child.yearGroup, classCode: child.classCode },
      assignments: childAssignments
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};