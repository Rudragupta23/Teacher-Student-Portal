const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const { deleteFileFromS3 } = require('../utils/s3Utils');

// generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @desc    Register a new user & Send OTP
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password, phone, yearGroup, isParent, linkedStudentId, schoolName, city, country } = req.body;

  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required.' });
    }
        const cleanPhone = phone.replace(/[\s-]/g, '');
    const validUK = /^\+447\d{9}$/.test(cleanPhone);
    const validIN = /^\+91[6-9]\d{9}$/.test(cleanPhone);
    if (!validUK && !validIN) {
      return res.status(400).json({
        message: 'Please enter a valid UK (+44) or Indian (+91) mobile number.'
      });
    }

        const userExists = await User.findOne({ email });
    if (userExists) {
      // Started with Google but never finished the profile step
      if (userExists.authProvider === 'google' && !userExists.isProfileComplete) {
        return res.status(400).json({
          message: 'You already started signing up with Google. Please click "Sign in with Google" to finish setting up your account.'
        });
      }
      // Finished Google account trying to use email signup
      if (userExists.authProvider === 'google') {
        return res.status(400).json({
          message: 'This email is registered with Google. Please use "Sign in with Google" to log in.'
        });
      }
      return res.status(400).json({ message: 'User already exists. Please log in instead.' });
    }

    let role = email === process.env.ADMIN_EMAIL ? 'admin' : (isParent ? 'parent' : 'student');
    
    if (role === 'student' && (!schoolName || !city)) {
      return res.status(400).json({ message: 'School name and city are required.' });
    }

    let newStudentId = undefined;
    if (role === 'student') {
      const studentCount = await User.countDocuments({ role: 'student', yearGroup: yearGroup });
      const sequenceNumber = String(studentCount + 1).padStart(2, '0');
      const cleanYearGroup = (yearGroup || '').replace(/\s+/g, '');
      newStudentId = `MCM-${cleanYearGroup}-${sequenceNumber}`;
    }

    if (role === 'parent') {
      if (!linkedStudentId) {
        return res.status(400).json({ message: 'Please provide your child\'s Student ID.' });
      }
      
      const childExists = await User.findOne({ studentId: linkedStudentId, role: 'student' });
      if (!childExists) {
        return res.status(404).json({ message: 'Invalid Student ID. Child not found.' });
      }

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
      status: (role === 'admin' || role === 'parent') ? 'active' : 'pending',
      authProvider: 'local',
      isProfileComplete: true,
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

    await sendSMS({
      phone: user.phone,
      message: `Welcome to MathCom Mentors! Your verification code is ${otp}. Valid for 10 minutes.`
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

      const adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (adminUser && adminUser.phone) {
        await sendSMS({
          phone: adminUser.phone,
          message: `Action Required: New student ${name} registered. Pending approval.`
        });
      }
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

        // If registered via a social provider, prompt to use that provider
    if (user.authProvider && user.authProvider !== 'local' && !user.password) {
      const providerName = user.authProvider === 'microsoft' ? 'Microsoft' : 'Google';
      return res.status(400).json({ message: `This account was created with ${providerName}. Please use "Sign in with ${providerName}".` });
    }

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
      user: { id: user._id, name: user.name, email: user.email, role: user.role, authProvider: user.authProvider || 'local' }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Google OAuth Sign-In / Start Sign-Up
// @route   POST /api/auth/google
exports.googleAuth = async (req, res) => {
  const { email, name, profilePic } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email from Google is required.' });
    }

    let user = await User.findOne({ email });

    // Scenario 1: User does not exist -> Create initial incomplete profile
    if (!user) {
      const isInitialAdmin = email === process.env.ADMIN_EMAIL;
      user = await User.create({
        name: name || 'Google User',
        registrationName: name || 'Google User',
        email,
        profilePic: profilePic || '',
        authProvider: 'google',
        isProfileComplete: isInitialAdmin,
        role: isInitialAdmin ? 'admin' : 'student',
        status: isInitialAdmin ? 'active' : 'pending',
        isVerified: true
      });

      if (isInitialAdmin) {
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.status(200).json({
          requiresProfileCompletion: false,
          token,
          user: { id: user._id, name: user.name, email: user.email, role: user.role, authProvider: 'google' }
        });
      }

      return res.status(200).json({
        requiresProfileCompletion: true,
        user: { email: user.email, name: user.name, profilePic: user.profilePic }
      });
    }

    // Scenario 2: User exists but profile is incomplete
    if (!user.isProfileComplete) {
      return res.status(200).json({
        requiresProfileCompletion: true,
        user: { email: user.email, name: user.name, profilePic: user.profilePic }
      });
    }

    // Scenario 3: Returning user with complete profile
    if (user.role === 'student' && user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is pending teacher approval. Please wait until your teacher activates your account.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your registration was rejected by the teacher.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      requiresProfileCompletion: false,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, authProvider: user.authProvider || 'google' }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error during Google Authentication', error: error.message });
  }
};

// @desc    Microsoft OAuth Sign-In / Start Sign-Up
// @route   POST /api/auth/microsoft
exports.microsoftAuth = async (req, res) => {
  const { accessToken } = req.body;

  try {
    if (!accessToken) {
      return res.status(400).json({ message: 'Microsoft access token is required.' });
    }

    // Verify the token by asking Microsoft Graph who it belongs to.
    // If the token is fake or expired, Graph rejects it and we stop here.
    const graphRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!graphRes.ok) {
      return res.status(401).json({ message: 'Microsoft sign-in could not be verified. Please try again.' });
    }

    const profile = await graphRes.json();

    // Work accounts populate `mail`; personal accounts sometimes only have userPrincipalName.
    const email = (profile.mail || profile.userPrincipalName || '').trim().toLowerCase();
    const name = profile.displayName || 'Microsoft User';

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        message: 'Your Microsoft account does not expose an email address. Please sign up with email instead.'
      });
    }

    // Case-insensitive lookup so we never create a duplicate of an existing account.
    const safeEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let user = await User.findOne({ email: new RegExp(`^${safeEmail}$`, 'i') });

    // Scenario 1: Brand new user -> create an incomplete profile
    if (!user) {
      const isInitialAdmin = email === (process.env.ADMIN_EMAIL || '').toLowerCase();

      user = await User.create({
        name,
        registrationName: name,
        email,
        profilePic: '',
        authProvider: 'microsoft',
        isProfileComplete: isInitialAdmin,
        role: isInitialAdmin ? 'admin' : 'student',
        status: isInitialAdmin ? 'active' : 'pending',
        isVerified: true
      });

      if (isInitialAdmin) {
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.status(200).json({
          requiresProfileCompletion: false,
          token,
          user: { id: user._id, name: user.name, email: user.email, role: user.role, authProvider: 'microsoft' }
        });
      }

      return res.status(200).json({
        requiresProfileCompletion: true,
        user: { email: user.email, name: user.name, profilePic: user.profilePic }
      });
    }

    // Scenario 2: Email already belongs to a different sign-in method
    if (user.authProvider === 'local') {
      return res.status(400).json({
        message: 'This email is already registered with a password. Please sign in with your email and password.'
      });
    }
    if (user.authProvider === 'google') {
      return res.status(400).json({
        message: 'This email is already registered with Google. Please use "Sign in with Google".'
      });
    }

    // Scenario 3: Existing Microsoft user who never finished onboarding
    if (!user.isProfileComplete) {
      return res.status(200).json({
        requiresProfileCompletion: true,
        user: { email: user.email, name: user.name, profilePic: user.profilePic }
      });
    }

    // Scenario 4: Returning Microsoft user with a complete profile
    if (user.role === 'student' && user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is pending teacher approval. Please wait until your teacher activates your account.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your registration was rejected by the teacher.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      requiresProfileCompletion: false,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, authProvider: user.authProvider || 'microsoft' }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error during Microsoft Authentication', error: error.message });
  }
};

// @desc    Complete Google Profile (Step 2 of Onboarding)
// @route   POST /api/auth/complete-google-profile
exports.completeGoogleProfile = async (req, res) => {
  const { email, name, phone, yearGroup, isParent, linkedStudentId, schoolName, city, country } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Account not found. Please start with Google Sign In.' });
    }

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required.' });
    }
        const cleanPhone = phone.replace(/[\s-]/g, '');
    const validUK = /^\+447\d{9}$/.test(cleanPhone);
    const validIN = /^\+91[6-9]\d{9}$/.test(cleanPhone);
    if (!validUK && !validIN) {
      return res.status(400).json({
        message: 'Please enter a valid UK (+44) or Indian (+91) mobile number.'
      });
    }

    let role = email === process.env.ADMIN_EMAIL ? 'admin' : (isParent ? 'parent' : 'student');
    
    if (role === 'student' && (!schoolName || !city)) {
      return res.status(400).json({ message: 'School name and city are required.' });
    }

    let newStudentId = user.studentId;
    if (role === 'student' && !newStudentId) {
      const studentCount = await User.countDocuments({ role: 'student', yearGroup: yearGroup });
      const sequenceNumber = String(studentCount + 1).padStart(2, '0');
      const cleanYearGroup = (yearGroup || '').replace(/\s+/g, '');
      newStudentId = `MCM-${cleanYearGroup}-${sequenceNumber}`;
    }

    if (role === 'parent') {
      if (!linkedStudentId) {
        return res.status(400).json({ message: 'Please provide your child\'s Student ID.' });
      }
      
      const childExists = await User.findOne({ studentId: linkedStudentId, role: 'student' });
      if (!childExists) {
        return res.status(404).json({ message: 'Invalid Student ID. Child not found.' });
      }

      const parentAlreadyExists = await User.findOne({ linkedStudentId: linkedStudentId, role: 'parent', _id: { $ne: user._id } });
      if (parentAlreadyExists) {
        return res.status(400).json({ message: 'An account for this student\'s parent already exists. Only one parent account is allowed per student.' });
      }
    }

    user.name = name || user.name;
    user.registrationName = name || user.name;
    user.phone = cleanPhone;
    user.role = role;
    user.status = (role === 'admin' || role === 'parent') ? 'active' : 'pending';
    user.yearGroup = role === 'student' ? yearGroup : undefined;
    user.schoolName = role === 'student' ? schoolName : undefined;
    user.city = role === 'student' ? city : undefined;
    user.country = role === 'student' ? country : undefined;
    user.studentId = newStudentId;
    user.linkedStudentId = role === 'parent' ? linkedStudentId : undefined;
    user.isProfileComplete = true;
    user.isVerified = true;

    await user.save();

        if (role === 'student') {
      const providerLabel = user.authProvider === 'microsoft' ? 'Microsoft'
        : user.authProvider === 'google' ? 'Google' : 'Email';
      const adminAlertHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px; border-radius: 16px;">
          <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
            <h2 style="color: #6d28d9; margin-top: 0; font-size: 24px; font-weight: 800;">Action Required</h2>
                        <h3 style="color: #1e293b; font-size: 20px; margin-bottom: 16px;">New ${providerLabel} Student Registration</h3>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              A new student, <strong>${user.name}</strong> (${user.email}), has registered via ${providerLabel}.
            </p>
            
            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #b45309; font-size: 15px; font-weight: 600; margin: 0;">
                Their account is currently pending admin approval.
              </p>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">
              Please log in to your Admin Dashboard to review and approve their access.
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        email: process.env.ADMIN_EMAIL,
                subject: `Pending Approval: New Student Registration (${providerLabel})`,
        html: adminAlertHtml
      }).catch(err => console.error("Admin Email Alert Failed:", err.message));

      const adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (adminUser && adminUser.phone) {
        await sendSMS({
          phone: adminUser.phone,
          message: `Action Required: New student ${user.name} registered via ${providerLabel}. Pending approval.`
        });
      }
    }

    res.status(200).json({
      message: role === 'parent' 
        ? 'Profile completed successfully! You can now log in.' 
        : 'Profile completed successfully! Your account is now pending admin approval.',
      isPending: user.status === 'pending'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error completing profile', error: error.message });
  }
};

// @desc    Send OTP for Password Reset
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

        // Safeguard: Check if account uses a social provider
    if (user.authProvider && user.authProvider !== 'local') {
      const providerName = user.authProvider === 'microsoft' ? 'Microsoft' : 'Google';
      return res.status(400).json({ 
        message: `This email is linked to a ${providerName} account. Password reset is not applicable. Please use "Sign in with ${providerName}".` 
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
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
            If you did not request this password reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Your Password Reset Code - MathCom Mentors',
      html: emailHtml
    });

    let maskedPhone = null;
    if (user.phone) {
      await sendSMS({
        phone: user.phone,
        message: `MathCom Mentors: Your password reset code is ${otp}. Valid for 10 minutes.`
      });
      
      // Mask the phone number for frontend security (e.g. +44 ****** 0997)
      const last4 = user.phone.slice(-4);
      const prefix = user.phone.startsWith('+44') ? '+44' : user.phone.startsWith('+91') ? '+91' : user.phone.slice(0, 3);
      maskedPhone = `${prefix} ****** ${last4}`;
    }

    res.status(200).json({ 
      message: 'Secure code sent! Please check your email.',
      maskedPhone 
    });
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

        if (user.authProvider && user.authProvider !== 'local') {
      const providerName = user.authProvider === 'microsoft' ? 'Microsoft' : 'Google';
      return res.status(400).json({ message: `This account uses ${providerName} Sign In. Password changes are not supported.` });
    }

    if (user.resetPasswordOtp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (user.resetPasswordExpires < new Date()) return res.status(400).json({ message: 'OTP has expired' });

    if (user.password) {
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({ message: 'Your new password cannot be the same as your old password.' });
      }
    }

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
      if (user.profilePic && user.profilePic !== profilePic) {
        await deleteFileFromS3(user.profilePic);
      }
      
      user.profilePic = profilePic;
      user.markModified('profilePic');
    }
    
    await user.save();
    res.status(200).json({ message: 'Profile saved!', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password for logged in user
// @route   PUT /api/auth/profile/password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

        // Safeguard for social sign-in users
    if (user.authProvider && user.authProvider !== 'local') {
      const providerName = user.authProvider === 'microsoft' ? 'Microsoft' : 'Google';
      return res.status(400).json({ 
        message: `Your account is authenticated via ${providerName}. Password changes are managed through ${providerName}.` 
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'Your new password cannot be the same as your old password.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password successfully updated!' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Resend Verification OTP for Registration
// @route   POST /api/auth/resend-verification-otp
exports.resendVerificationOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.isVerified) {
      return res.status(400).json({ message: 'Account is already verified. You can log in.' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px; border-radius: 16px;">
        <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
          <h2 style="color: #6d28d9; margin-top: 0; font-size: 28px; font-weight: 800;">MathCom Mentors</h2>
          <h3 style="color: #1e293b; font-size: 22px; margin-bottom: 16px;">Here is your new code! 🎉</h3>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
            We generated a fresh verification code for you. Please use the secure code below to complete your registration:
          </p>
          <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
            <strong style="font-size: 42px; letter-spacing: 12px; color: #6d28d9; display: block; margin-left: 12px;">${otp}</strong>
          </div>
          <p style="color: #64748b; font-size: 14px; background-color: #fffbeb; padding: 12px; border-radius: 8px; display: inline-block;">
            ⏳ This code will expire in <strong>10 minutes</strong>.
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Your New Verification Code - MathCom Mentors',
      html: emailHtml
    });

    if (user.phone) {
      await sendSMS({
        phone: user.phone,
        message: `MathCom Mentors: Your new verification code is ${otp}. Expires in 10 mins.`
      });
    }

    res.status(200).json({ message: 'A new verification code has been sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};