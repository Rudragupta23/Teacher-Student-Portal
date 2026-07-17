const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  weekNo: { type: String }, 
  topic: { type: String },  
  description: { type: String },
  type: { type: String, enum: ['File', 'MCQ', 'Text'], default: 'File' },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reminderSent: { type: Boolean, default: false },
  
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  
  fileUrl: { type: String }, 
  content: { type: String }, 
  studentInstructions: { type: String },
  mcqs: [{
    question: String,
    options: [String],
    correctOption: Number 
  }],
  
  status: { type: String, enum: ['Pending', 'Submitted', 'Graded'], default: 'Pending' },
  dueDate: { type: Date, required: true }, 
  startDate: { type: Date }, 
  isTest: { type: Boolean, default: false }, 
  driveLink: { type: String, default: '' },
  
  submission: {
    answerText: { type: String },
    answerFileUrl: { type: String },
    submittedAt: { type: Date }
  },
  
  grading: {
    score: { type: Number },
    totalScore: { type: Number },
    feedback: { type: String },
    adminAnswerSheetUrl: { type: String },
    gradedAt: { type: Date },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Homework', homeworkSchema);