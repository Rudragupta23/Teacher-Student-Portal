const ClassPlanner = require('../models/ClassPlanner');
const { v4: uuidv4 } = require('uuid');

exports.createClassSession = async (req, res) => {
  try {
    const { topic, startDate, endDate, isRecurring, yearGroupFilter, studentId } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const sessions = [];
    const groupId = uuidv4();

    if (isRecurring) {
      let currentStart = new Date(start);
      let currentEnd = new Date(end);
      
      const limitDate = new Date(start);
      limitDate.setMonth(limitDate.getMonth() + 2);

      while (currentStart <= limitDate) {
        sessions.push({
          topic,
          startDate: new Date(currentStart),
          endDate: new Date(currentEnd),
          isRecurring: true,
          groupId,
          yearGroupFilter: yearGroupFilter || 'all',
          studentId: studentId || 'all'
        });
        currentStart.setDate(currentStart.getDate() + 7);
        currentEnd.setDate(currentEnd.getDate() + 7);
      }
    } else {
      sessions.push({ 
        topic, 
        startDate: start, 
        endDate: end, 
        isRecurring: false, 
        groupId,
        yearGroupFilter: yearGroupFilter || 'all',
        studentId: studentId || 'all'
      });
    }

    await ClassPlanner.insertMany(sessions);
    res.status(201).json({ message: 'Class session(s) created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating class session', error: error.message });
  }
};

exports.getClassSessions = async (req, res) => {
  try {
    const sessions = await ClassPlanner.find().sort({ startDate: 1 });
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching class sessions', error: error.message });
  }
};

exports.deleteClassSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteAllRecurring } = req.query; // If true, deletes the whole series
    
    const session = await ClassPlanner.findById(id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (deleteAllRecurring === 'true' && session.groupId) {
      await ClassPlanner.deleteMany({ groupId: session.groupId });
    } else {
      await ClassPlanner.findByIdAndDelete(id);
    }
    
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting session', error: error.message });
  }
};