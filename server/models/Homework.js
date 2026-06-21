// server/models/Homework.js
const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['File', 'MCQ', 'Text'], default: 'File' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  
  // Dynamic Content Fields based on 'type'
  fileUrl: { type: String }, 
  content: { type: String }, // For text-based questions
  mcqs: [{
    question: String,
    options: [String],
    correctOption: Number // Index of the correct option (0-3)
  }],
  
  status: { type: String, enum: ['Pending', 'Submitted', 'Graded'], default: 'Pending' },
  dueDate: { type: Date, required: true }, // Direct date from frontend calendar
  
  submission: {
    answerText: { type: String },
    answerFileUrl: { type: String },
    submittedAt: { type: Date }
  },
  
  grading: {
    score: { type: Number },
    feedback: { type: String },
    adminAnswerSheetUrl: { type: String },
    gradedAt: { type: Date }
  },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Homework', homeworkSchema);