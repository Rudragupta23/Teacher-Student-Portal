const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // The assignment details
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard', 'Mixed'], default: 'Mixed' },
  fileUrl: { type: String }, // If admin uploads a PDF/Image
  
  status: { type: String, enum: ['Pending', 'Submitted', 'Graded'], default: 'Pending' },
  dueDate: { type: Date },
  
  // Student's Submission
  submission: {
    answerText: { type: String },
    answerFileUrl: { type: String },
    submittedAt: { type: Date }
  },
  
  // Admin's Adaptive Grading
  grading: {
    score: { type: Number },
    canDoEasy: { type: Boolean },
    canDoMedium: { type: Boolean },
    canDoHard: { type: Boolean },
    feedback: { type: String }
  },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Homework', homeworkSchema);