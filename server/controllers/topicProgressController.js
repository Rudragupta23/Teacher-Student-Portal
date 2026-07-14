const TopicProgress = require('../models/TopicProgress');
const User = require('../models/User');

exports.getTopics = async (req, res) => {
  try {
    let filter = {};

    // 1. If the logged-in user is a STUDENT
    if (req.user.role === 'student') {
      filter = {
        $or: [{ studentId: req.user._id }, { studentId: null }]
      };
    } 
    
    // 2. If the logged-in user is a PARENT
    else if (req.user.role === 'parent') {
      const child = await User.findOne({ studentId: req.user.linkedStudentId, role: 'student' });
      
      if (child) {
        filter = {
          $or: [{ studentId: child._id }, { studentId: null }]
        };
      } else {
        filter = { studentId: null };
      }
    }

    const topics = await TopicProgress.find(filter)
      .populate('studentId', 'name registrationName yearGroup')
      .sort({ createdAt: -1 });

    res.status(200).json(topics);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createTopic = async (req, res) => {
  try {
    const { topicName, areaName, grade, datesCovered, studentId } = req.body;

    const newTopic = await TopicProgress.create({ topicName, areaName, grade, datesCovered, studentId });
    
    if (newTopic.studentId) {
      await newTopic.populate('studentId', 'name registrationName yearGroup');
    }
    
    res.status(201).json(newTopic);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create topic' });
  }
};
exports.deleteTopic = async (req, res) => {
  try {
    await TopicProgress.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Topic deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete topic' });
  }
};

exports.updateTopic = async (req, res) => {
  try {
    const { topicName, areaName, grade, datesCovered, studentId } = req.body;
    
    const updatedTopic = await TopicProgress.findByIdAndUpdate(
      req.params.id,
      { topicName, areaName, grade, datesCovered, studentId },
      { returnDocument: 'after' }
    ).populate('studentId', 'name registrationName yearGroup');
    
    res.status(200).json(updatedTopic);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update topic' });
  }
};