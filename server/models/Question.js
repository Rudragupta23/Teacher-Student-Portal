const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  qualification: { type: String, required: true }, // e.g., "GCSE Maths - Foundation"
  chapter: { type: String, required: true },       // e.g., "Algebra"
  topic: { type: String, required: true },         // e.g., "Equations"
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  type: { type: String, enum: ['MCQ', 'Text', 'File'], required: true },
  
  // The actual question content
  questionText: { type: String },
  questionFileUrl: { type: String }, // If you upload an image/pdf of the question
  
  // For Auto-Grading
  options: [{ type: String }], // Used if type is MCQ
  correctAnswer: { type: String }, // Exact text or option required to get auto-graded as correct
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);