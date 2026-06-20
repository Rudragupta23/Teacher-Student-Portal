const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Array of Question IDs assigned to this student
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  
  status: { type: String, enum: ['Pending', 'Submitted', 'Graded'], default: 'Pending' },
  dueDate: { type: Date, required: true },
  
  // Student's submitted answers
  studentAnswers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    answerText: { type: String },
    answerFileUrl: { type: String },
    isCorrect: { type: Boolean } // Filled by Auto-Grader
  }],
  
  // Admin's Adaptive Review
  adminReview: {
    canDoEasy: { type: Boolean, default: null },
    canDoMedium: { type: Boolean, default: null },
    canDoHard: { type: Boolean, default: null }
  },
  
  finalScore: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Homework', homeworkSchema);