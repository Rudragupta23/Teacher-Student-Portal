const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Register a new user & Send OTP
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  // const { name, email, password, phone, classCode, yearGroup, isParent, linkedStudentId } = req.body;
  const { name, email, password, phone, yearGroup, isParent, linkedStudentId, schoolName, city, country } = req.body;

  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const cleanPhone = phone ? phone.replace(/[\s-]/g, '') : '';
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (phone && !phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ message: 'Please enter a valid phone number.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // Determine Role
    let role = email === process.env.ADMIN_EMAIL ? 'admin' : (isParent ? 'parent' : 'student');
    
    // if (role === 'student' && classCode !== process.env.ADMIN_CLASS_CODE) {
    //   return res.status(403).json({ message: 'Invalid Class Code' });
    // }

    // Logic for Student ID Generation and Parent Validation
    let newStudentId = undefined;
    if (role === 'student') {
      // 1. Count how many students already exist in this specific year group
      const studentCount = await User.countDocuments({ role: 'student', yearGroup: yearGroup });
      
      // 2. Add 1 for the new student, and ensure it is 2 digits (e.g., 1 becomes '01')
      const sequenceNumber = String(studentCount + 1).padStart(2, '0');
      
      // 3. Remove any spaces from the year group for a clean ID (e.g., 'AS Level' becomes 'ASLevel')
      const cleanYearGroup = yearGroup.replace(/\s+/g, '');
      
      // 4. Combine them into the final ID
      newStudentId = `MCM-${cleanYearGroup}-${sequenceNumber}`;
    }

    if (role === 'parent') {
      if (!linkedStudentId) {
        return res.status(400).json({ message: 'Please provide your child\'s Student ID.' });
      }
      
      // 1. Verify that the child actually exists in the database
      const childExists = await User.findOne({ studentId: linkedStudentId, role: 'student' });
      if (!childExists) {
        return res.status(404).json({ message: 'Invalid Student ID. Child not found.' });
      }

      // 2. NEW: Check if a parent is already linked to this student
      const parentAlreadyExists = await User.findOne({ linkedStudentId: linkedStudentId, role: 'parent' });
      if (parentAlreadyExists) {
        return res.status(400).json({ message: 'An account for this student\'s parent already exists. Only one parent account is allowed per student.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

    const user = await User.create({
      name, 
      registrationName: name, 
      email, 
      password: hashedPassword, 
      phone: cleanPhone, 
      role,
      status: role === 'admin' ? 'active' : 'pending',
      // classCode: role === 'admin' ? process.env.ADMIN_CLASS_CODE : (role === 'student' ? classCode : undefined),
      yearGroup: role === 'student' ? yearGroup : undefined,
      schoolName: role === 'student' ? schoolName : undefined,
      city: role === 'student' ? city : undefined,
      country: role === 'student' ? country : undefined,
      studentId: newStudentId,                                
      linkedStudentId: role === 'parent' ? linkedStudentId : undefined, 
      isVerified: false,
      otp,
      otpExpires
    });

    // Send the OTP Email
    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px; border-radius: 16px;">
        <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
          <h2 style="color: #6d28d9; margin-top: 0; font-size: 28px; font-weight: 800;">MathCom Mentors</h2>
          <h3 style="color: #1e293b; font-size: 22px; margin-bottom: 16px;">Welcome, ${name}! 🎉</h3>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
            We are thrilled to have you on board. To complete your registration and verify your account, please use the secure code below:
          </p>
          <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
            <strong style="font-size: 42px; letter-spacing: 12px; color: #6d28d9; display: block; margin-left: 12px;">${otp}</strong>
          </div>
          <p style="color: #64748b; font-size: 14px; background-color: #fffbeb; padding: 12px; border-radius: 8px; display: inline-block;">
            ⏳ This code will expire in <strong>10 minutes</strong>.
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
            If you did not sign up for this account, you can safely ignore this email.
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Verify Your Account - MathCom Mentors',
      html: emailHtml
    });
    if (role === 'student') {
      const adminAlertHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px; border-radius: 16px;">
          <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
            <h2 style="color: #6d28d9; margin-top: 0; font-size: 24px; font-weight: 800;">Action Required</h2>
            <h3 style="color: #1e293b; font-size: 20px; margin-bottom: 16px;">New Student Registration</h3>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              A new student, <strong>${name}</strong> (${email}), has just registered.
            </p>
            
            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #b45309; font-size: 15px; font-weight: 600; margin: 0;">
                Their account is currently pending.
              </p>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">
              Please log in to your Admin Dashboard at your convenience to review and approve their access.
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        email: process.env.ADMIN_EMAIL,
        subject: 'Pending Approval: New Student Registration',
        html: adminAlertHtml
      });
    }

    res.status(201).json({ message: 'Account created! Please check your email for the OTP.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (user.isVerified) return res.status(400).json({ message: 'Account is already verified' });

    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (user.otpExpires < new Date()) return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    if (user.role === 'student' && user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is pending teacher approval. Please wait until your teacher activates your account.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your registration was rejected by the teacher.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Send OTP for Password Reset
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px; border-radius: 16px;">
        <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
          <h2 style="color: #4F46E5; margin-top: 0; font-size: 28px; font-weight: 800;">MathCom Mentors</h2>
          <h3 style="color: #1e293b; font-size: 22px; margin-bottom: 16px;">Secure Password Reset</h3>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
            We received a request to reset the password for your account. Please use the verification code below to securely set a new password:
          </p>
          <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
            <strong style="font-size: 42px; letter-spacing: 12px; color: #4F46E5; display: block; margin-left: 12px;">${otp}</strong>
          </div>
          <p style="color: #64748b; font-size: 14px; background-color: #fffbeb; padding: 12px; border-radius: 8px; display: inline-block;">
            ⏳ This code is valid for the next <strong>10 minutes</strong>.
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
            If you did not request this password reset, you can safely ignore this email. Your account remains secure and no changes will be made.
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Your Password Reset Code - MathCom Mentors',
      html: emailHtml
    });

    res.status(200).json({ message: 'Secure code sent! Please check your email.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Reset Password using OTP
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.resetPasswordOtp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (user.resetPasswordExpires < new Date()) return res.status(400).json({ message: 'OTP has expired' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully! You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, profilePic } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (name) user.name = name; 
    if (profilePic !== undefined) {
      user.profilePic = profilePic;
      user.markModified('profilePic');
    }
    
    await user.save();
    res.status(200).json({ message: 'Profile saved!', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};