const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  status: { type: String, enum: ['pending', 'submitted', 'graded'], default: 'pending' },
  studentAnswers: [{ 
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    answer: { type: String } // What the student typed or uploaded
  }],
  dueDate: { type: Date, required: true },
  score: { type: Number, default: null } // Null means not graded yet
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);