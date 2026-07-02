const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  startTime: {
        type: String
    },
    endTime: {
        type: String
    },
  title: { type: String, required: true },
  weekNo: { type: String },
  topic: { type: String },
  description: { type: String },
  classStatus: { 
    type: String, 
    enum: ['Class Taken', 'Class Cancelled by Teacher', 'Class Cancelled by Student'], 
    default: 'Class Taken' 
  },
  graderInstruction: { type: String },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scheme', schemeSchema);