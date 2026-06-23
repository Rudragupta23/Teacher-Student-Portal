const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  qualification: { type: String, required: true }, 
  chapter: { type: String, required: true },       
  topic: { type: String, required: true },         
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  type: { type: String, enum: ['MCQ', 'Text', 'File'], required: true },
  
  questionText: { type: String },
  questionFileUrl: { type: String }, 
  
  options: [{ type: String }], // Used if type is MCQ
  correctAnswer: { type: String }, // Exact text or option required to get auto-graded as correct
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);