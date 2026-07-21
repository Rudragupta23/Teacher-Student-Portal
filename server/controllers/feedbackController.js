const Feedback = require('../models/Feedback');

exports.submitFeedback = async (req, res) => {
  try {
    const { feature, message, rating } = req.body;
    const feedback = await Feedback.create({ user: req.user._id, feature, message, rating });
    res.status(201).json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting feedback', error: error.message });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().populate('user', 'name role email').sort({ createdAt: -1 });
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
};

exports.markReviewed = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, { isReviewed: true }, { returnDocument: 'after' });
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.status(200).json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({ message: 'Error marking feedback', error: error.message });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.status(200).json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting feedback', error: error.message });
  }
};