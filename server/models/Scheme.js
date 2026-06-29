const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  title: { type: String, required: true },
  weekNo: { type: String },
  topic: { type: String },
  description: { type: String },
  classTaken: { type: Boolean, default: true },
  graderInstruction: { type: String },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scheme', schemeSchema);