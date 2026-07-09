const mongoose = require('mongoose');

const classPlannerSchema = new mongoose.Schema({
  topic: { type: String, default: 'Class Session' },
  weekNo: { type: String },
  title: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isRecurring: { type: Boolean, default: false },
  groupId: { type: String },
  yearGroupFilter: { type: String, default: 'all' },
  studentId: { type: String, default: 'all' } 
}, { timestamps: true });

module.exports = mongoose.model('ClassPlanner', classPlannerSchema);