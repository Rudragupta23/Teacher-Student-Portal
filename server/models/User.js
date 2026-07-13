const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  registrationName: { type: String },    
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },  
  isVerified: { type: Boolean, default: false }, 
  otp: { type: String },                       
  otpExpires: { type: Date },                    
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected'],
    default: 'pending' 
  },
  role: { type: String, enum: ['admin', 'grader', 'student', 'parent'], default: 'student' },
  allocatedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  studentId: { type: String, unique: true, sparse: true }, 
  linkedStudentId: { type: String },                     

  profilePic: { type: String, default: '' },
  phone: { type: String },
  // classCode: { type: String },
  schoolName: { type: String },
  city: { type: String },
  country: { type: String, default: 'United Kingdom' },
  yearGroup: { 
    type: String, 
    enum: ['Y6', 'Y7', 'Y8', 'Y9', 'Y10', 'Y11', 'AS Level', 'A level'] 
  },
  boardName: { type: String },
  resetPasswordOtp: { type: String },
  adminOverrides: {
    name: { type: String },
    phone: { type: String },
    schoolName: { type: String },
    city: { type: String }
    },
  resetPasswordExpires: { type: Date },
  
  performance: {
    canDoEasy: { type: Boolean, default: false },
    canDoMedium: { type: Boolean, default: false },
    canDoHard: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);