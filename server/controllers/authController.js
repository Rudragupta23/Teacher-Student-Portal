const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Register a new user & Send OTP
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password, phone, classCode, yearGroup } = req.body;

  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const cleanPhone = phone.replace(/[\s-]/g, '');
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (phone && !phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ message: 'Please enter a valid phone number.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    let role = email === process.env.ADMIN_EMAIL ? 'admin' : 'student';
    
    if (role === 'student' && classCode !== process.env.ADMIN_CLASS_CODE) {
      return res.status(403).json({ message: 'Invalid Class Code' });
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
      classCode: role === 'admin' ? process.env.ADMIN_CLASS_CODE : classCode,
      yearGroup: role === 'student' ? yearGroup : undefined,
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