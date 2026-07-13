const mongoose = require('mongoose');

const topicProgressSchema = new mongoose.Schema({
  topicName: { type: String, required: true },
  areaName: { type: String, required: true },
  grade: { type: String, required: true },
  datesCovered: [{ type: String, required: true }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TopicProgress', topicProgressSchema);