const mongoose = require('mongoose');

const classPlannerSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isRecurring: { type: Boolean, default: false },
  groupId: { type: String } 
}, { timestamps: true });

module.exports = mongoose.model('ClassPlanner', classPlannerSchema);