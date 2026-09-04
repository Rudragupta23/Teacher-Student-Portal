import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, Key, ShieldCheck, ArrowLeft, AlertCircle, Send, CheckCircle2, Loader2, Eye, EyeOff, School, MapPin, Globe, GraduationCap } from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { useMsal } from '@azure/msal-react';
import { loginRequest, msalRedirect } from '../../config/msalConfig';

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

  if (view === 'signup' || view === 'complete-profile') {
    if (!phone) return 'Please enter a phone number.';
    const cleanPhone = phone.replace(/[\s-]/g, '');
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (!phoneRegex.test(cleanPhone)) return 'Please enter a valid phone number.';
  }
  return null;
};

const AuthPage = ({ defaultView = 'login', defaultParentMode = false }) => {
  const navigate = useNavigate();
  const [view, setView] = useState(defaultView); 
  const { loginUser } = useContext(AuthContext);
  const { instance: msalInstance } = useMsal();
  const [isParentMode, setIsParentMode] = useState(defaultParentMode); 
  const [maskedPhone, setMaskedPhone] = useState('');

  useEffect(() => {
    setView(defaultView);
    setIsParentMode(defaultParentMode);
    setStatusMsg({ type: '', text: '' });
    setFormData(prev => ({
      ...prev,
      password: '',
      newPassword: '',
      otp: ''
    }));
  }, [defaultView, defaultParentMode]);

  const [showPassword, setShowPassword] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' }); 
  const [isLoading, setIsLoading] = useState(false); 

  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const [formData, setFormData] = useState({
        name: '', email: '', password: '', phone: '', countryCode: '', otp: '', newPassword: '', yearGroup: '', linkedStudentId: '', schoolName: '', city: '', country: 'United Kingdom'
  });

  const handleChange = (e) => {
    setStatusMsg({ type: '', text: '' }); 
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCountryCodeChange = (e) => {
    const code = e.target.value;
    const country = code === '+44' ? 'United Kingdom' : code === '+91' ? 'India' : formData.country;
    setFormData({ ...formData, countryCode: code, country });
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
    navigate('/forgot-password'); 
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    setIsResending(true);
    setStatusMsg({ type: '', text: '' });
    try {
      if (view === 'otp') {
        await api.post('/auth/resend-verification-otp', { email: formData.email });
        setStatusMsg({ type: 'success', text: 'A new verification code has been sent to your email and phone.' });
      } else {
        await api.post('/auth/forgot-password', { email: formData.email });
        setStatusMsg({ type: 'success', text: 'A fresh secure code has been sent to your email and phone.' });
      }
      setResendTimer(90); 
    } catch (error) {
      setStatusMsg({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to resend code. Please try again.' 
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' }); 
    setIsLoading(true);

    const fullPhone = formData.countryCode + formData.phone;
    const errorMsg = validateData(formData.email, fullPhone, view);
    if (errorMsg && (view === 'login' || view === 'signup' || view === 'forgot' || view === 'reset' || view === 'complete-profile')) {
      setStatusMsg({ type: 'error', text: errorMsg });
      setIsLoading(false); 
      return;
    }

    try {
      if (view === 'signup') {
        const payload = { ...formData, phone: fullPhone, isParent: isParentMode };
        const res = await api.post('/auth/register', payload);
        setStatusMsg({ type: 'success', text: res.data.message });
        changeView('otp');
      }
      else if (view === 'complete-profile') {
        const payload = { ...formData, phone: fullPhone, isParent: isParentMode };
        const res = await api.post('/auth/complete-google-profile', payload);
        setStatusMsg({ type: 'success', text: res.data.message });
        setTimeout(() => {
          changeView('login');
        }, 3000);
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
        if (res.data.maskedPhone) setMaskedPhone(res.data.maskedPhone);
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

const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        setStatusMsg({ type: '', text: '' });
        
        // Fetch the user's profile info securely using the Google token
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const decoded = await userInfoRes.json();
        
        // Send the details to our backend route
        const res = await api.post('/auth/google', {
          email: decoded.email,
          name: decoded.name,
          profilePic: decoded.picture
        });

        if (res.data.requiresProfileCompletion) {
          // User needs to finish onboarding
          setFormData(prev => ({
            ...prev,
            email: res.data.user.email,
            name: res.data.user.name,
          }));
          changeView('complete-profile');
          setStatusMsg({ type: 'success', text: 'Google verified! Just a few more details to complete your profile.' });
        } else {
          // Returning user -> Log them in instantly
          loginUser(res.data.user, res.data.token);
        }
      } catch (error) {
        setStatusMsg({ 
          type: 'error', 
          text: error.response?.data?.message || 'Google authentication failed. Please try again.' 
        });
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setStatusMsg({ type: 'error', text: 'Google Sign-In was cancelled or failed.' })
  });

  const finishMicrosoftLogin = async (accessToken) => {
    try {
      setIsLoading(true);
      setStatusMsg({ type: '', text: '' });

      const res = await api.post('/auth/microsoft', { accessToken });

      if (res.data.requiresProfileCompletion) {
        setFormData(prev => ({
          ...prev,
          email: res.data.user.email,
          name: res.data.user.name,
        }));
        changeView('complete-profile');
        setStatusMsg({ type: 'success', text: 'Microsoft verified! Just a few more details to complete your profile.' });
      } else {
        loginUser(res.data.user, res.data.token);
      }
    } catch (error) {
      console.error('MS BACKEND ERROR:', error?.response?.status, error?.response?.data);
      setStatusMsg({
        type: 'error',
        text: error.response?.data?.message || 'Microsoft authentication failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      setIsLoading(true);
      setStatusMsg({ type: '', text: '' });
      sessionStorage.setItem('ms_parent_mode', isParentMode ? '1' : '0');
      await msalInstance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('MS REDIRECT ERROR:', error?.errorCode, error);
      setStatusMsg({
        type: 'error',
        text: `${error?.errorCode || 'Error'}: ${error?.errorMessage || error?.message || 'Sign-in could not start.'}`
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (msalRedirect.result?.accessToken) {
      const token = msalRedirect.result.accessToken;
      msalRedirect.result = null; 

      if (sessionStorage.getItem('ms_parent_mode') === '1') {
        setIsParentMode(true);
      }
      sessionStorage.removeItem('ms_parent_mode');

      finishMicrosoftLogin(token);
    }
  }, []);

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
    <div className="min-h-screen bg-[#F5EAD8] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-700/10 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-amber-700/10 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-5xl w-full min-h-[620px] bg-[#FBF4E7] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row z-10 relative border border-[#DCC7A4]">
        
        <div className="md:w-1/2 p-12 text-[#FBF4E7] flex flex-col justify-center relative bg-[#3B2A1B] overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
          <FloatingMath />
          
          <div className="relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-4xl xl:text-5xl font-extrabold mb-6 tracking-tight drop-shadow-xl whitespace-normal md:whitespace-nowrap"
            >
              <span className="text-[#FBF4E7]">MathCom</span> <br className="md:hidden" /> <span className="text-orange-600">Mentors</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-[#E4D3B9] text-lg leading-relaxed max-w-md"
            >
              {view === 'login' ? 'Ready to master maths? Log in to access your dashboard and tackle your next challenge.' 
               : view === 'signup' && !isParentMode ? 'Join your class today. Experience adaptive learning tailored just for you.' 
               : view === 'signup' && isParentMode ? 'Track your child\'s progress, view report cards, and connect with mentors directly.' 
               : view === 'complete-profile' ? 'Almost done! Please provide your remaining student details to complete registration.'
               : view === 'forgot' ? 'Almost there! Enter your email ID and we will instantly send a secure code to your email and phone.'
               : view === 'reset' ? 'Check your inbox or messages! Enter the 6-digit secure code we sent to your email and phone, then pick a new password.'
               : 'Security is our priority. Please check your email and phone for the 6-digit verification code we just sent.'}
            </motion.p>
          </div>
        </div>

        <div className="md:w-1/2 p-6 sm:p-10 lg:p-14 relative bg-[#FBF4E7] flex flex-col justify-center">
          
          {(view === 'forgot' || view === 'reset' || view === 'complete-profile') && (
            <button 
              type="button" 
              onClick={() => {
                // Clear out the Google data and return to the login view
                setFormData({ name: '', email: '', password: '', phone: '', countryCode: '', otp: '', newPassword: '', yearGroup: '', linkedStudentId: '', schoolName: '', city: '', country: 'United Kingdom' });
                changeView('login');
                navigate('/login');
              }} 
              className="absolute top-4 left-6 sm:top-8 sm:left-8 text-[#8A7358] hover:text-orange-700 flex items-center gap-2 transition-colors font-semibold outline-none z-20"
            >
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
                <h2 className="text-4xl font-extrabold text-[#3E2C1B] tracking-tight mb-2">
                  {view === 'login' ? 'Sign In' 
                   : view === 'signup' ? 'Create Account' 
                   : view === 'complete-profile' ? 'Complete Profile'
                   : view === 'forgot' ? 'Reset Password' 
                   : view === 'reset' ? 'Create New Password' 
                   : 'Verify Account'}
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
                   <p className="text-sm font-medium leading-snug">Please check your SMS messages and email spam/junk folder if you don't receive the code within a minute.</p>
                 </motion.div>
              )}
              
              {/* SOCIAL SIGN IN BUTTONS */}
              {(view === 'login' || view === 'signup') && (
                <motion.div variants={itemVariants} className="w-full mb-2">
                  <p className="text-sm font-semibold text-[#6E5942] mb-2">
                    {view === 'signup' ? 'Sign up with' : 'Sign in with'}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleGoogleLogin()}
                      disabled={isLoading}
                      aria-label={view === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                      className="flex items-center justify-center gap-2 py-3 px-2 bg-[#F5EAD8] border border-[#DCC7A4] hover:border-[#3B2A1B] hover:bg-[#EFE0C9] disabled:opacity-60 disabled:cursor-not-allowed text-[#3E2C1B] text-sm font-semibold rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-[#3B2A1B] focus:border-[#3B2A1B] transition-all"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Google
                    </button>

                    <button
                      type="button"
                      onClick={handleMicrosoftLogin}
                      disabled={isLoading}
                      aria-label={view === 'signup' ? 'Sign up with Microsoft' : 'Sign in with Microsoft'}
                      className="flex items-center justify-center gap-2 py-3 px-2 bg-[#F5EAD8] border border-[#DCC7A4] hover:border-[#3B2A1B] hover:bg-[#EFE0C9] disabled:opacity-60 disabled:cursor-not-allowed text-[#3E2C1B] text-sm font-semibold rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-[#3B2A1B] focus:border-[#3B2A1B] transition-all"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path fill="#f35325" d="M1 1h10v10H1z" />
                        <path fill="#81bc06" d="M12 1h10v10H12z" />
                        <path fill="#05a6f0" d="M1 12h10v10H1z" />
                        <path fill="#ffba08" d="M12 12h10v10H12z" />
                      </svg>
                      Microsoft
                    </button>
                  </div>

                  <div className="flex items-center mt-4">
                    <div className="flex-1 border-t border-[#DCC7A4]"></div>
                    <span className="px-3 text-xs text-[#A08D74] font-bold uppercase tracking-wider whitespace-nowrap">
                      {view === 'signup' ? 'Or sign up with email' : 'Or use your email'}
                    </span>
                    <div className="flex-1 border-t border-[#DCC7A4]"></div>
                  </div>
                </motion.div>
              )}

              {(view === 'login' || view === 'signup' || view === 'complete-profile') && (
                <motion.div variants={itemVariants} className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#A08D74] group-focus-within:text-[#3B2A1B] transition-colors" size={20} />
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="Email Address" 
                    required 
                    readOnly={view === 'complete-profile'} 
                    onChange={handleChange} 
                    value={formData.email}
                    className={`w-full pl-12 pr-4 py-4 rounded-xl border outline-none transition-all ${view === 'complete-profile' ? 'bg-[#EFE0C9] border-[#DCC7A4] text-[#6E5942] cursor-not-allowed' : 'bg-[#F5EAD8] border-[#DCC7A4] text-[#3E2C1B] focus:bg-[#FBF4E7] focus:ring-2 focus:ring-[#3B2A1B] focus:border-[#3B2A1B]'}`} 
                  />
                </motion.div>
              )}

              {view === 'forgot' && (
                <motion.div variants={itemVariants} className="bg-[#EFE0C9] border border-[#DCC7A4] rounded-2xl p-6 text-center my-2 flex flex-col gap-2">
                  <p className="text-orange-700 font-semibold text-sm uppercase tracking-wider">Sending reset code to:</p>
                  <div className="flex items-center justify-center gap-2 text-lg font-bold text-[#3E2C1B]">
                    <Mail size={18} className="text-orange-600" />
                    {formData.email}
                  </div>
                </motion.div>
              )}

              {(view === 'otp' || view === 'reset') && (
                <motion.div variants={itemVariants} className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#A08D74] group-focus-within:text-[#3B2A1B] transition-colors" size={22} />
                  <input type="text" name="otp" value={formData.otp} placeholder="• • • • • •" required maxLength="6" onChange={handleChange}
                    className="w-full pl-12 pr-4 py-4 text-center tracking-[0.5em] font-mono text-2xl font-bold bg-[#F5EAD8] text-[#3E2C1B] rounded-xl border border-[#DCC7A4] outline-none focus:bg-[#FBF4E7] focus:ring-2 focus:ring-[#3B2A1B] focus:border-[#3B2A1B] transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-xl placeholder:font-normal placeholder:text-[#A08D74]" />
                </motion.div>
              )}

              {view === 'otp' && (
                <motion.div variants={itemVariants} className="flex justify-center mt-1 mb-2">
                  <p className="text-sm text-[#6E5942] font-medium">
                    Didn't receive the code?{' '}
                    <button 
                      type="button" 
                      onClick={handleResendCode} 
                      disabled={resendTimer > 0 || isResending}
                      className={`font-bold transition-colors outline-none ${
                        resendTimer > 0 || isResending 
                          ? 'text-[#A08D74] cursor-not-allowed' 
                          : 'text-orange-700 hover:text-orange-800 hover:underline'
                      }`}
                    >
                      {isResending 
                        ? 'Sending...' 
                        : resendTimer > 0 
                          ? `Resend in ${resendTimer}s` 
                          : 'Send new code'}
                    </button>
                  </p>
                </motion.div>
              )}

              {(view === 'login' || view === 'signup') && (
                <motion.div variants={itemVariants} className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#A08D74] group-focus-within:text-[#3B2A1B] transition-colors" size={20} />
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} placeholder={view === 'signup' ? 'Set password' : 'Enter your password'} required onChange={handleChange}
                    className="w-full pl-12 pr-12 py-4 bg-[#F5EAD8] text-[#3E2C1B] rounded-xl border border-[#DCC7A4] outline-none focus:bg-[#FBF4E7] focus:ring-2 focus:ring-[#3B2A1B] focus:border-[#3B2A1B] transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#A08D74] hover:text-[#3E2C1B] outline-none">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </motion.div>
              )}

              {view === 'reset' && (
                <>
                  <motion.div variants={itemVariants} className="bg-[#EFE0C9] border border-[#DCC7A4] rounded-2xl p-6 text-center my-2 flex flex-col gap-2">
                    <p className="text-orange-700 font-semibold text-sm uppercase tracking-wider">Reset code sent to:</p>
                    <div className="flex items-center justify-center gap-2 text-lg font-bold text-[#3E2C1B]">
                      <Mail size={18} className="text-orange-600" />
                      {formData.email}
                    </div>
                    {maskedPhone && (
                      <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#6E5942]">
                        <Phone size={16} className="text-orange-600" />
                        {maskedPhone}
                      </div>
                    )}
                  </motion.div>

                  <motion.div variants={itemVariants} className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#A08D74] group-focus-within:text-[#3B2A1B] transition-colors" size={20} />
                    <input type={showNewPassword ? "text" : "password"} name="newPassword" value={formData.newPassword} placeholder="Enter New Password" required onChange={handleChange}
                      className="w-full pl-12 pr-12 py-4 bg-[#F5EAD8] text-[#3E2C1B] rounded-xl border border-[#DCC7A4] outline-none focus:bg-[#FBF4E7] focus:ring-2 focus:ring-[#3B2A1B] focus:border-[#3B2A1B] transition-all" />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#A08D74] hover:text-[#3E2C1B] outline-none">
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </motion.div>
                  <motion.div variants={itemVariants} className="flex justify-center mt-3">
                    <p className="text-sm text-[#6E5942] font-medium">
                      Didn't receive the code?{' '}
                      <button 
                        type="button" 
                        onClick={handleResendCode} 
                        disabled={resendTimer > 0 || isResending}
                        className={`font-bold transition-colors outline-none ${
                          resendTimer > 0 || isResending 
                            ? 'text-[#A08D74] cursor-not-allowed' 
                            : 'text-orange-700 hover:text-orange-800 hover:underline'
                        }`}
                      >
                        {isResending 
                          ? 'Sending...' 
                          : resendTimer > 0 
                            ? `Resend in ${resendTimer}s` 
                            : 'Resend it now'}
                      </button>
                    </p>
                  </motion.div>
                </>
              )}

              {(view === 'signup' || view === 'complete-profile') && (
                <>
                  <motion.div variants={itemVariants} className="relative group">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#A08D74] group-focus-within:text-[#3B2A1B] transition-colors" size={20} />
                    <input type="text" name="name" value={formData.name} placeholder={isParentMode ? "Parent's Full Name" : "Student's Full Name"} required onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 bg-[#F5EAD8] text-[#3E2C1B] rounded-xl border border-[#DCC7A4] outline-none focus:bg-[#FBF4E7] focus:ring-2 focus:ring-[#3B2A1B] focus:border-[#3B2A1B] transition-all" />
                  </motion.div>
                  
                  <motion.div variants={itemVariants} className="flex gap-2 relative group">
                    <div className="w-[35%] relative">
                      <select name="countryCode" required onChange={handleCountryCodeChange} value={formData.countryCode}
                        className="w-full px-4 py-4 bg-[#F5EAD8] text-[#3E2C1B] rounded-xl border border-[#DCC7A4] outline-none focus:bg-[#FBF4E7] focus:ring-2 focus:ring-[#3B2A1B] focus:border-[#3B2A1B] transition-all appearance-none cursor-pointer">
                        <option value="" disabled>Country</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+91">🇮🇳 +91</option>
                      </select>
                    </div>
                    <div className="w-[65%] relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#A08D74] group-focus-within:text-[#3B2A1B] transition-colors" size={20} />
                      <input type="tel" name="phone" value={formData.phone} placeholder="10-digit number" required maxLength="10" 
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, ''); // Ensure only numbers
                          if (val.startsWith('0')) val = val.substring(1); // Exclude 0 from starting
                          handleChange({ target: { name: 'phone', value: val } });
                        }}
                        className="w-full pl-12 pr-4 py-4 bg-[#F5EAD8] text-[#3E2C1B] rounded-xl border border-[#DCC7A4] outline-none focus:bg-[#FBF4E7] focus:ring-2 focus:ring-[#3B2A1B] focus:border-[#3B2A1B] transition-all" />
                    </div>
                  </motion.div>

                  {!isParentMode && (
                    <>
                      <motion.div variants={itemVariants} className="relative group">
                        <School className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#A08D74] group-focus-within:text-[#3B2A1B] transition-colors" size={20} />
                        <input type="text" name="schoolName" placeholder="School Name" required onChange={handleChange} value={formData.schoolName}
                          className="w-full pl-12 pr-4 py-4 bg-[#F5EAD8] text-[#3E2C1B] rounded-xl border border-[#DCC7A4] outline-none focus:bg-[#FBF4E7] focus:ring-2 focus:ring-[#3B2A1B] focus:border-[#3B2A1B] transition-all" />
                      </motion.div>

                      <motion.div variants={itemVariants} className="relative group">
                        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#A08D74] group-focus-within:text-[#3B2A1B] transition-colors" size={20} />
                        <input type="text" name="city" placeholder="City" required onChange={handleChange} value={formData.city}
                          className="w-full pl-12 pr-4 py-4 bg-[#F5EAD8] text-[#3E2C1B] rounded-xl border border-[#DCC7A4] outline-none focus:bg-[#FBF4E7] focus:ring-2 focus:ring-[#3B2A1B] focus:border-[#3B2A1B] transition-all" />
                      </motion.div>

                      <motion.div variants={itemVariants} className="relative group">
                        <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#A08D74] transition-colors" size={20} />
                        <input type="text" name="country" required value={formData.country} readOnly
                          className="w-full pl-12 pr-4 py-4 bg-[#EFE0C9] text-[#6E5942] rounded-xl border border-[#DCC7A4] outline-none cursor-not-allowed transition-all font-bold" />
                      </motion.div>

                      <motion.div variants={itemVariants} className="relative group">
                        <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#A08D74] group-focus-within:text-[#3B2A1B] transition-colors" size={20} />
                        <select name="yearGroup" required onChange={handleChange} value={formData.yearGroup}
                          className="w-full pl-12 pr-4 py-4 bg-[#F5EAD8] text-[#3E2C1B] rounded-xl border border-[#DCC7A4] outline-none focus:bg-[#FBF4E7] focus:ring-2 focus:ring-[#3B2A1B] focus:border-[#3B2A1B] transition-all appearance-none cursor-pointer">
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

                  {isParentMode && (
                    <motion.div variants={itemVariants} className="relative group">
                      <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#A08D74] group-focus-within:text-[#3B2A1B] transition-colors" size={20} />
                      <input type="text" name="linkedStudentId" placeholder="Child's Student ID (e.g., MCM-YearGroup-XX)" required onChange={handleChange} value={formData.linkedStudentId}
                        className="w-full pl-12 pr-4 py-4 bg-[#F5EAD8] text-[#3E2C1B] rounded-xl border border-[#DCC7A4] outline-none focus:bg-[#FBF4E7] focus:ring-2 focus:ring-[#3B2A1B] focus:border-[#3B2A1B] transition-all" />
                    </motion.div>
                  )}
                </>
              )}

              {view === 'login' && (
                <motion.div variants={itemVariants} className="flex justify-end">
                  <button type="button" onClick={handleForgotClick} className="text-sm font-semibold text-orange-700 hover:text-orange-800 transition-colors outline-none">
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
                className={`w-full py-4 mt-2 text-[#FBF4E7] text-lg font-bold rounded-xl outline-none transition-all ${
                  isLoading 
                    ? 'bg-[#8A7358] cursor-not-allowed shadow-none' 
                    : 'bg-[#3B2A1B] hover:bg-[#4A3524] shadow-md'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <Loader2 className="animate-spin" size={24} />
                    Processing...
                  </span>
                ) : (
                  view === 'login' ? 'Sign In' 
                  : view === 'signup' ? 'Create Account' 
                  : view === 'complete-profile' ? 'Save & Submit Details'
                  : view === 'forgot' ? 'Send Reset Link' 
                  : view === 'reset' ? 'Save New Password' 
                  : 'Verify Code'
                )}
              </motion.button>

              {(view === 'login' || view === 'signup') && (
                <motion.div variants={itemVariants} className="text-center text-sm text-[#6E5942] font-medium mt-2 pt-6 border-t border-[#DCC7A4] flex flex-col gap-3">
                  {view === 'login' ? (
                    <p>Don't have an account? <button type="button" onClick={() => navigate('/signup')} className="text-orange-700 font-bold hover:underline outline-none">Sign up</button></p>
                  ) : (
                    <p>Already have an account? <button type="button" onClick={() => navigate('/login')} className="text-orange-700 font-bold hover:underline outline-none">Log in</button></p>
                  )}
                  
                  <button 
                    type="button" 
                    onClick={() => {
                      navigate(isParentMode ? '/signup' : '/parent-signup');
                    }} 
                    className="inline-flex items-center justify-center gap-2 text-[#6E5942] hover:text-[#3E2C1B] transition-colors font-semibold"
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