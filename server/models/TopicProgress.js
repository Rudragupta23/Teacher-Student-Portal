const mongoose = require('mongoose');

const topicProgressSchema = new mongoose.Schema({
  topicName: { type: String, required: true },
  areaName: { type: String, required: false, default: '' },  grade: { type: String, required: true },
  yearLevel: { type: String, required: false },
  studentConfidence: { type: String, enum: ['Red', 'Amber', 'Green', ''], required: false, default: '' },
  datesCovered: [{ type: String }],
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TopicProgress', topicProgressSchema);