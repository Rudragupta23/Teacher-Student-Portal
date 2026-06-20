const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },  
  isVerified: { type: Boolean, default: false }, 
  otp: { type: String },                       
  otpExpires: { type: Date },                    
  role: { type: String, enum: ['admin', 'student'], default: 'student' },
  phone: { type: String },
  classCode: { type: String },
  resetPasswordOtp: { type: String },
  resetPasswordExpires: { type: Date },
  
  
  
  // Adaptive Learning Tracker
  performance: {
    canDoEasy: { type: Boolean, default: false },
    canDoMedium: { type: Boolean, default: false },
    canDoHard: { type: Boolean, default: false }
  }
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);