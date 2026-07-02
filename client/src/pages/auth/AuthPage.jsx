import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, Key, ShieldCheck, ArrowLeft, AlertCircle, Send, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';


const FloatingMath = () => {
  const symbols = ['π', '∞', '∑', '∫', '√', '≈', '÷', '×'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {symbols.map((sym, i) => {
        const xPosition = (i * 11) + 5; 
        
        return (
          <motion.div
            key={i}
            className="absolute text-white/40 text-6xl font-black drop-shadow-2xl"
            initial={{ opacity: 0, top: '100%', left: `${xPosition}%` }}
            animate={{ 
              opacity: [0, 0.8, 0], 
              top: ['100%', '-20%'], 
            }}
            transition={{ 
              duration: Math.random() * 10 + 12, 
              repeat: Infinity, 
              delay: Math.random() * 8, 
              ease: "linear"
            }}
          >
            {sym}
          </motion.div>
        );
      })}
    </div>
  );
};


const validateData = (email, phone, view) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address.';

  if (view === 'signup' && phone) {
    const cleanPhone = phone.replace(/[\s-]/g, '');
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (!phoneRegex.test(cleanPhone)) return 'Please enter a valid phone number.';
  }
  return null;
};

const AuthPage = () => {
  const [view, setView] = useState('login'); 
  const { loginUser } = useContext(AuthContext);
  const [isParentMode, setIsParentMode] = useState(false); 
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' }); 
  const [isLoading, setIsLoading] = useState(false); 

  // const [formData, setFormData] = useState({
  //   name: '', email: '', password: '', phone: '', classCode: '', otp: '', newPassword: '', yearGroup: '', linkedStudentId: '' 
  // });
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', otp: '', newPassword: '', yearGroup: '', linkedStudentId: '', schoolName: '', city: '', country: 'United Kingdom'
  });

  const handleChange = (e) => {
    setStatusMsg({ type: '', text: '' }); 
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const changeView = (newView) => {
    setView(newView);
    setStatusMsg({ type: '', text: '' }); 
    setFormData(prev => ({
      ...prev,
      password: '',
      newPassword: '',
      otp: ''
    }));
  };

  const handleForgotClick = () => {
    const errorMsg = validateData(formData.email, formData.phone, 'forgot');
    if (errorMsg) {
      setStatusMsg({ type: 'error', text: errorMsg });
      return;
    }
    changeView('forgot'); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' }); 
    setIsLoading(true);

    const errorMsg = validateData(formData.email, formData.phone, view);
    if (errorMsg && (view === 'login' || view === 'signup' || view === 'forgot' || view === 'reset')) {
      setStatusMsg({ type: 'error', text: errorMsg });
      setIsLoading(false); 
      return;
    }

    try {
      if (view === 'signup') {
        // Pass the isParentMode state to the backend
        const payload = { ...formData, isParent: isParentMode };
        const res = await api.post('/auth/register', payload);
        setStatusMsg({ type: 'success', text: res.data.message });
        changeView('otp');
      }
      else if (view === 'otp') {
        const res = await api.post('/auth/verify-otp', { email: formData.email, otp: formData.otp });
        setStatusMsg({ type: 'success', text: res.data.message });
        changeView('login');
      } 
      else if (view === 'login') {
        const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
        loginUser(res.data.user, res.data.token);
      }
      else if (view === 'forgot') {
        setStatusMsg({ type: 'success', text: 'Sending secure code...' });
        const res = await api.post('/auth/forgot-password', { email: formData.email });
        setStatusMsg({ type: 'success', text: res.data.message });
        changeView('reset');
      }
      else if (view === 'reset') {
        const res = await api.post('/auth/reset-password', { 
          email: formData.email, 
          otp: formData.otp, 
          newPassword: formData.newPassword 
        });
        setStatusMsg({ type: 'success', text: res.data.message });
        changeView('login');
      }
    } catch (error) {
      setStatusMsg({ 
        type: 'error', 
        text: error.response?.data?.message || 'An error occurred. Please try again.' 
      });
    } finally {
      setIsLoading(false); 
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-5xl w-full min-h-[620px] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row z-10 relative border border-gray-100/10">
        
        <div className="md:w-1/2 p-12 text-white flex flex-col justify-center relative bg-gradient-to-br from-indigo-700 via-violet-800 to-blue-900 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
          <FloatingMath />
          
          <div className="relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-4xl xl:text-5xl font-extrabold mb-6 tracking-tight drop-shadow-xl"
            >
              <span className="text-white">MathCom</span> <span className="text-sky-400">Mentors</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-indigo-100 text-lg leading-relaxed max-w-md"
            >
              {view === 'login' ? 'Ready to master maths? Log in to access your dashboard and tackle your next challenge.' 
               : view === 'signup' && !isParentMode ? 'Join your class today. Experience adaptive learning tailored just for you.' 
               : view === 'signup' && isParentMode ? 'Track your child\'s progress, view report cards, and connect with mentors directly.' 
               : view === 'forgot' ? 'Almost there! Verify your email ID and we will send a secure reset link instantly.'
               : view === 'reset' ? 'Check your inbox! Enter the 6-digit secure code we emailed you and pick a new password.'
               : 'Security is our priority. Please check your email for the 6-digit verification code we just sent.'}
            </motion.p>
          </div>
        </div>

        <div className="md:w-1/2 p-6 sm:p-10 lg:p-14 relative bg-white flex flex-col justify-center">
          
          {(view === 'forgot' || view === 'reset') && (
            <button type="button" onClick={() => changeView('login')} className="absolute top-4 left-6 sm:top-8 sm:left-8 text-gray-400 hover:text-indigo-600 flex items-center gap-2 transition-colors font-semibold outline-none z-20">
              <ArrowLeft size={18} /> Back
            </button>
          )}

          <AnimatePresence mode="wait">
            <motion.form
              key={view}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onSubmit={handleSubmit}
              className="w-full flex flex-col gap-4"
            >
              <motion.div variants={itemVariants} className="mb-2 pt-8 sm:pt-0">
                <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
                  {view === 'login' ? 'Sign In' : view === 'signup' ? 'Create Account' : view === 'forgot' ? 'Reset Password' : view === 'reset' ? 'Create New Password' : 'Verify Email'}
                </h2>
              </motion.div>

              {/* INLINE STATUS MESSAGE */}
              <AnimatePresence>
                {statusMsg.text && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                      statusMsg.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}
                  >
                    {statusMsg.type === 'error' ? (
                      <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-600" />
                    ) : (
                      <CheckCircle2 size={20} className="shrink-0 mt-0.5 text-emerald-600" />
                    )}
                    <p className="text-sm font-medium leading-snug">{statusMsg.text}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SPAM WARNING FOR OTP/RESET */}
              {(view === 'otp' || view === 'reset') && !statusMsg.text && (
                 <motion.div variants={itemVariants} className="flex items-start gap-3 bg-amber-50/80 text-amber-800 p-4 rounded-xl border border-amber-200/50">
                   <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-600" />
                   <p className="text-sm font-medium leading-snug">Please check your spam or junk folder if you don't see the email within a minute.</p>
                 </motion.div>
              )}

              {(view === 'login' || view === 'signup') && (
                <motion.div variants={itemVariants} className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                  <input type="email" name="email" placeholder="Email Address" required onChange={handleChange} value={formData.email}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all" />
                </motion.div>
              )}

              {view === 'forgot' && (
                <motion.div variants={itemVariants} className="bg-violet-50 border border-violet-100 rounded-2xl p-6 text-center my-2">
                  <p className="text-violet-600 font-semibold mb-2 text-sm uppercase tracking-wider">Sending reset code to:</p>
                  <div className="flex items-center justify-center gap-2 text-xl font-bold text-gray-900">
                    <Send size={20} className="text-violet-500" />
                    {formData.email}
                  </div>
                </motion.div>
              )}

              {(view === 'otp' || view === 'reset') && (
                <motion.div variants={itemVariants} className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors" size={22} />
                  <input type="text" name="otp" value={formData.otp} placeholder="• • • • • •" required maxLength="6" onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 text-center tracking-[0.5em] font-mono text-2xl font-bold bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-xl placeholder:font-normal placeholder:text-gray-400" />
                </motion.div>
              )}

              {(view === 'login' || view === 'signup') && (
                <motion.div variants={itemVariants} className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} placeholder={view === 'signup' ? 'Set password' : 'Enter your password'} required onChange={handleChange}
                    className="w-full pl-12 pr-12 py-4 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 outline-none">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </motion.div>
              )}

              {view === 'reset' && (
                <motion.div variants={itemVariants} className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                  <input type={showNewPassword ? "text" : "password"} name="newPassword" value={formData.newPassword} placeholder="Enter New Password" required onChange={handleChange}
                    className="w-full pl-12 pr-12 py-4 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 outline-none">
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </motion.div>
              )}

              {view === 'signup' && (
                <>
                  <motion.div variants={itemVariants} className="relative group">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                    <input type="text" name="name" placeholder={isParentMode ? "Parent's Full Name" : "Student's Full Name"} required onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all" />
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="relative group">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                    <input type="tel" name="phone" placeholder="Phone Number" onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all" />
                  </motion.div>

                  {/* SHOW THESE ONLY FOR STUDENTS */}
                  {!isParentMode && (
                    <>
                      {/* <motion.div variants={itemVariants} className="relative group">
                        <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                        <input type="text" name="classCode" placeholder="Class Code (From Admin)" required onChange={handleChange}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all" />
                      </motion.div> */}
                      <motion.div variants={itemVariants} className="relative group">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                        <input type="text" name="schoolName" placeholder="School Name" required onChange={handleChange} value={formData.schoolName}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all" />
                      </motion.div>

                      <motion.div variants={itemVariants} className="relative group">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                        <input type="text" name="city" placeholder="City" required onChange={handleChange} value={formData.city}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all" />
                      </motion.div>

                      <motion.div variants={itemVariants} className="relative group">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                        <select name="country" required onChange={handleChange} value={formData.country}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all appearance-none cursor-pointer">
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Others">Others</option>
                        </select>
                      </motion.div>
                      <motion.div variants={itemVariants} className="relative group">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                        <select name="yearGroup" required onChange={handleChange} value={formData.yearGroup}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all appearance-none cursor-pointer">
                          <option value="" disabled>Select Year Group</option>
                          <option value="Y6">Y6</option>
                          <option value="Y7">Y7</option>
                          <option value="Y8">Y8</option>
                          <option value="Y9">Y9</option>
                          <option value="Y10">Y10</option>
                          <option value="Y11">Y11</option>
                          <option value="AS Level">AS Level</option>
                          <option value="A level">A level</option>
                        </select>
                      </motion.div>
                    </>
                  )}

                  {/* SHOW THIS ONLY FOR PARENTS */}
                  {isParentMode && (
                    <motion.div variants={itemVariants} className="relative group">
                      <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-violet-600 transition-colors" size={20} />
                      <input type="text" name="linkedStudentId" placeholder="Child's Student ID (e.g., MCM-YearGroup-XX)" required onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:bg-white focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all" />
                    </motion.div>
                  )}
                </>
              )}

              {view === 'login' && (
                <motion.div variants={itemVariants} className="flex justify-end">
                  <button type="button" onClick={handleForgotClick} className="text-sm font-semibold text-violet-600 hover:text-violet-800 transition-colors outline-none">
                    Forgot Password?
                  </button>
                </motion.div>
              )}

              <motion.button 
                variants={itemVariants}
                whileHover={{ scale: isLoading ? 1 : 1.01 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                type="submit" 
                disabled={isLoading}
                className={`w-full py-4 mt-2 text-white text-lg font-bold rounded-xl shadow-lg outline-none transition-all ${
                  isLoading 
                    ? 'bg-violet-400 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-violet-200'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <Loader2 className="animate-spin" size={24} />
                    Processing...
                  </span>
                ) : (
                  view === 'login' ? 'Sign In' : view === 'signup' ? 'Create Account' : view === 'forgot' ? 'Send Reset Link' : view === 'reset' ? 'Save New Password' : 'Verify Code'
                )}
              </motion.button>

              {(view === 'login' || view === 'signup') && (
                <motion.div variants={itemVariants} className="text-center text-sm text-gray-500 font-medium mt-2 pt-6 border-t border-gray-100 flex flex-col gap-3">
                  {view === 'login' ? (
                    <p>Don't have an account? <button type="button" onClick={() => changeView('signup')} className="text-violet-600 font-bold hover:underline outline-none">Sign up</button></p>
                  ) : (
                    <p>Already have an account? <button type="button" onClick={() => changeView('login')} className="text-violet-600 font-bold hover:underline outline-none">Log in</button></p>
                  )}
                  
                  {/* NEW PARENT/STUDENT TOGGLE */}
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsParentMode(!isParentMode);
                      changeView('signup'); // Force to signup view if they toggle
                    }} 
                    className="inline-flex items-center justify-center gap-2 text-gray-600 hover:text-violet-700 transition-colors font-semibold"
                  >
                    <User size={16} />
                    {isParentMode ? "I am a Student" : "Are you a Parent? Click here"}
                  </button>
                </motion.div>
              )}
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;