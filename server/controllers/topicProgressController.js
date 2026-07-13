const TopicProgress = require('../models/TopicProgress');

exports.getTopics = async (req, res) => {
  try {
    const topics = await TopicProgress.find().sort({ createdAt: -1 });
    res.status(200).json(topics);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createTopic = async (req, res) => {
  try {
    const { topicName, areaName, grade, datesCovered } = req.body;
    const newTopic = await TopicProgress.create({ topicName, areaName, grade, datesCovered });
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
    const { topicName, areaName, grade, datesCovered } = req.body;
    
    const updatedTopic = await TopicProgress.findByIdAndUpdate(
      req.params.id,
      { topicName, areaName, grade, datesCovered },
      { returnDocument: 'after' }
    );
    
    res.status(200).json(updatedTopic);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update topic' });
  }
};