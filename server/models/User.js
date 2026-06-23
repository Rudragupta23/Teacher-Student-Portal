const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  registrationName: { type: String },    
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },  
  isVerified: { type: Boolean, default: false }, 
  otp: { type: String },                       
  otpExpires: { type: Date },                    
  role: { type: String, enum: ['admin', 'student'], default: 'student' },
  profilePic: { type: String, default: '' },
  phone: { type: String },
  classCode: { type: String },
  yearGroup: { 
    type: String, 
    enum: ['Y6', 'Y7', 'Y8', 'Y9', 'Y10', 'Y11', 'AS Level', 'A level'] 
  },
  resetPasswordOtp: { type: String },
  resetPasswordExpires: { type: Date },
  
  
  
  performance: {
    canDoEasy: { type: Boolean, default: false },
    canDoMedium: { type: Boolean, default: false },
    canDoHard: { type: Boolean, default: false }
  }
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);