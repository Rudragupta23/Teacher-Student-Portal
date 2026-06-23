import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function StudentDashboard() {
  // Tab Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [assignments, setAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // UI States
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [modalTask, setModalTask] = useState(null); 
  const [isLoading, setIsLoading] = useState(true); 
  
  // Submission Form State
  const [submitForm, setSubmitForm] = useState({ answerFileUrl: '', answerText: '' });
  const [mcqAnswers, setMcqAnswers] = useState({}); 
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  //  Student Profile & Settings State
  const [studentProfile, setStudentProfile] = useState({ name: 'Scholar', profilePic: '' });
  const [settingsForm, setSettingsForm] = useState({ name: '', profilePic: '' });
  const [isProfileUploading, setIsProfileUploading] = useState(false);
  const [userId, setUserId] = useState(null); 
  const [announcements, setAnnouncements] = useState([]);

  // Chat States
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // Study Library States
  const [resources, setResources] = useState([]);

  useEffect(() => {
    fetchAssignments();
    fetchProfile(); 
    fetchAnnouncements(); 
    fetchResources();
    
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.id);
      } catch (e) {
        console.error("Could not parse token");
      }
    }
  }, []);

  // Function to fetch announcements
  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements/student');
      setAnnouncements(res.data);
    } catch (error) {
      console.error("Error fetching announcements");
    }
  };

  // Function to mark announcement as read
  const markAnnouncementAsRead = async (id) => {
    try {
      await api.put(`/announcements/${id}/read`);
      fetchAnnouncements(); 
    } catch(e) {
      console.error("Error marking as read");
    }
  };

  const fetchProfile = async () => {
    setIsLoading(true); 
    try {
      const res = await api.get('/auth/profile');
      setStudentProfile({ name: res.data.name, profilePic: res.data.profilePic || '' });
      setSettingsForm({ name: res.data.name, profilePic: res.data.profilePic || '' });
    } catch (error) {
      console.error("Error fetching profile from DB");
    } finally {
      setIsLoading(false); 
    }
  };
  

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/homework/student');
      setAssignments(res.data);
    } catch (error) {
      showToast("Error fetching your assignments.", "error");
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get('/messages'); 
      setMessages(res.data);
    } catch (e) { console.error("Error fetching messages"); }
  };

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages();
    }
  }, [activeTab]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    try {
      await api.post('/messages', { content: chatInput }); 
      setChatInput('');
      fetchMessages(); 
    } catch (e) { showToast("Failed to send message", "error"); }
  }; 

  const fetchResources = async () => {
    try {
      const res = await api.get('/resources');
      setResources(res.data);
    } catch (e) { console.error("Error fetching library"); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    window.location.href = '/'; 
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) { 
        showToast("File is too large! Please keep it under 5MB.", "error");
        return;
      }
      setFileName(file.name);
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSubmitForm({ ...submitForm, answerFileUrl: reader.result });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (modalTask.type === 'MCQ') {
      if (Object.keys(mcqAnswers).length !== modalTask.mcqs.length) {
        return showToast("Please answer all MCQ questions before submitting!", "error");
      }
    } else if (!submitForm.answerFileUrl && !submitForm.answerText) {
      return showToast("Please attach a file or write an answer!", "error");
    }

    try {
      await api.post(`/homework/${modalTask._id}/submit`, { ...submitForm, mcqAnswers });
      showToast('🎉 Assignment submitted successfully!');
      setModalTask(null); 
      setSubmitForm({ answerFileUrl: '', answerText: '' }); 
      setMcqAnswers({}); 
      setFileName('');
      fetchAssignments();
    } catch (err) {
      showToast(err.response?.data?.message || 'Submission failed.', "error");
    }
  };

  const filteredAssignments = assignments.filter(hw => 
    hw.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Calculate Student Analytics
  const gradedHw = assignments.filter(h => h.status === 'Graded');
  const pendingHw = assignments.filter(h => h.status === 'Pending');
  const avgScore = gradedHw.length > 0 ? (gradedHw.reduce((acc, curr) => acc + (curr.grading?.score || 0), 0) / gradedHw.length).toFixed(1) : 0;

  // Handle Profile Picture Upload
  const handleProfilePicUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) return showToast("Profile picture must be under 2MB", "error");
      setIsProfileUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsForm(prev => ({ ...prev, profilePic: reader.result }));
        setIsProfileUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Profile Settings to Database
  const handleSaveSettings = async () => {
    try {
      const res = await api.put('/auth/profile', settingsForm);
      setStudentProfile({ name: res.data.user.name, profilePic: res.data.user.profilePic || '' });
      showToast("Profile Settings Saved to Database!");
    } catch (error) {
      showToast("Failed to save profile", "error");
    }
  };

  return (
    <div className="flex h-screen bg-[#F4F7FE] font-sans overflow-hidden text-slate-800 relative">
      
      {/* CUSTOM TOAST NOTIFICATION */}
      <div className={`absolute top-6 right-6 z-50 transform transition-all duration-500 ease-out flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-white
        ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${toast.type === 'error' ? 'bg-rose-500' : 'bg-slate-900'}`}>
        {toast.type === 'error' ? '⚠️' : '✅'}
        {toast.message}
      </div>

      {/* TASK VIEWER & SUBMISSION MODAL */}
      {modalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl transform scale-100 animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
            
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-3xl font-black text-[#1B2559]">{modalTask.title}</h3>
                <p className="text-sm font-bold text-indigo-500 mt-1">Due: {new Date(modalTask.dueDate).toLocaleString()}</p>
              </div>
              <button onClick={() => { setModalTask(null); setSubmitForm({ answerFileUrl: '', answerText: '' }); setFileName(''); }} className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-full transition-colors">
                ✕
              </button>
            </div>

            {/* 1. Show Assignment Content to Student */}
            {modalTask.status !== 'Graded' && (
              <div className="bg-[#F4F7FE] p-6 rounded-3xl mb-8">
                <h4 className="text-xs font-black text-[#A3AED0] uppercase tracking-wide mb-4">Assignment Details</h4>
                
                {modalTask.type === 'File' && modalTask.fileUrl && (
  <div className="flex flex-col gap-4 w-full">
    <p className="text-sm font-black text-[#1B2559] uppercase tracking-wide">Attachment Preview</p>
    
    <div className="w-full max-h-[400px] overflow-auto border-2 border-slate-200 rounded-2xl bg-white p-2 shadow-inner">
      {modalTask.fileUrl.startsWith('data:image') ? (
        <img src={modalTask.fileUrl} alt="Assignment" className="w-full h-auto rounded-xl object-contain" />
      ) : modalTask.fileUrl.startsWith('data:application/pdf') ? (
        <embed src={modalTask.fileUrl} type="application/pdf" className="w-full h-[380px] rounded-xl" />
      ) : (
        <p className="text-center text-slate-500 py-10 font-bold">Preview not available for this format.</p>
      )}
    </div>

    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
      <p className="font-bold text-indigo-800 text-sm">Do you want to download this file?</p>
      <button 
        type="button"
        onClick={() => {
          const a = document.createElement('a');
          a.href = modalTask.fileUrl;
          a.download = `${modalTask.title.replace(/\s+/g, '_')}_Attachment`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-md flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
        Download
      </button>
    </div>
  </div>
)}

                {modalTask.type === 'Text' && (
                  <p className="text-[#1B2559] font-medium whitespace-pre-wrap">{modalTask.content}</p>
                )}

                {modalTask.type === 'MCQ' && modalTask.status === 'Pending' && (
                  <div className="space-y-4">
                    <p className="text-sm text-indigo-500 font-bold mb-4">Select the correct option for each question:</p>
                    {modalTask.mcqs.map((mcq, idx) => (
                      <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                        <p className="font-black text-[#1B2559] mb-4 text-lg">Q{idx + 1}: {mcq.question}</p>
                        <div className="space-y-3">
                          {mcq.options.map((opt, oIdx) => (
                            <label key={oIdx} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${mcqAnswers[idx] === oIdx ? 'bg-indigo-50 border-indigo-500' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}>
                              <input type="radio" name={`q-${idx}`} value={oIdx} checked={mcqAnswers[idx] === oIdx} onChange={() => setMcqAnswers({...mcqAnswers, [idx]: oIdx})} className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                              <span className="text-sm font-bold text-slate-700">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button onClick={handleSubmit} className="w-full bg-[#1B2559] hover:bg-indigo-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg mt-6 transform hover:-translate-y-1">
                      Submit Quiz
                    </button>
                  </div>
                )}
              </div>
            )}

            {modalTask.status === 'Pending' ? (
              new Date() > new Date(modalTask.dueDate) ? (
                <div className="bg-rose-50 border border-rose-200 p-6 rounded-3xl text-center">
                  <div className="text-4xl mb-2">⏰</div>
                  <h4 className="text-xl font-black text-rose-600 mb-1">Time is Up!</h4>
                  <p className="text-rose-500 font-medium">The deadline for this assignment has passed. Please ask your mentor to extend the date.</p>
                </div>
              ) : modalTask.type !== 'MCQ' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h4 className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Your Submission</h4>
                  
                  <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 outline-none font-medium text-[#1B2559] min-h-[100px]" 
                    placeholder="Write your answer here (optional if attaching a file)..." 
                    value={submitForm.answerText} onChange={e => setSubmitForm({...submitForm, answerText: e.target.value})} />
                  
                  <div className="relative border-2 border-dashed border-indigo-300 bg-indigo-50/50 rounded-2xl p-6 text-center hover:bg-indigo-50 transition-colors cursor-pointer group">
                    <input type="file" accept=".pdf, image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileUpload} />
                    <p className="font-bold text-indigo-800 flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      Attach File (PDF/Image)
                    </p>
                    {isUploading && <p className="mt-2 text-xs font-bold text-amber-500">Processing file...</p>}
                    {fileName && !isUploading && <p className="mt-2 inline-block bg-white text-indigo-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">Attached: {fileName}</p>}
                  </div>

                  <button type="submit" className="w-full bg-[#1B2559] hover:bg-indigo-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg mt-4 transform hover:-translate-y-1">
                    Submit Homework
                  </button>
                </form>
              )
            ) : modalTask.status === 'Submitted' ? (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl text-center">
                <div className="text-4xl mb-2">⏳</div>
                <h4 className="text-xl font-black text-amber-700 mb-1">Under Review</h4>
                <p className="text-amber-600 font-medium">You have submitted your work. Waiting for your mentor to grade it.</p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl text-center flex flex-col items-center">
                <p className="text-emerald-600 font-bold text-sm mb-4 bg-emerald-100/50 px-4 py-2 rounded-full">Note: Original assignment content has been removed post-grading.</p>

                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center text-3xl font-black mb-4 shadow-lg shadow-emerald-500/30">
                {modalTask.grading?.score != null ? modalTask.grading.score : 'N/A'}
              </div>
              <h4 className="text-xl font-black text-emerald-800 mb-2">Graded Successfully!</h4>
              
              {modalTask.grading?.adminAnswerSheetUrl ? (
                <div className="flex flex-col gap-3 w-full mt-6 text-left">
                  <h4 className="text-xs font-black text-emerald-600 uppercase tracking-wide">Mentor's Answer Sheet</h4>
                  
                  <div className="w-full max-h-[400px] overflow-auto border-2 border-emerald-200 rounded-2xl bg-white p-2 shadow-inner">
                    {modalTask.grading.adminAnswerSheetUrl.startsWith('data:image') ? (
                      <img src={modalTask.grading.adminAnswerSheetUrl} alt="Answer Sheet" className="w-full h-auto rounded-xl object-contain" />
                    ) : modalTask.grading.adminAnswerSheetUrl.startsWith('data:application/pdf') ? (
                      <embed src={modalTask.grading.adminAnswerSheetUrl} type="application/pdf" className="w-full h-[380px] rounded-xl" />
                    ) : (
                      <p className="text-center text-slate-500 py-10 font-bold">Preview not available for this format.</p>
                    )}
                  </div>

                  <button type="button" onClick={() => {
                      const a = document.createElement('a');
                      a.href = modalTask.grading.adminAnswerSheetUrl;
                      a.download = `${modalTask.title.replace(/\s+/g, '_')}_Answer_Sheet`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    className="w-full mt-2 px-6 py-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-black rounded-2xl transition-all border-2 border-dashed border-emerald-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Download Answer Sheet
                  </button>
                </div>
              ) : (
                <p className="text-emerald-600 font-medium text-sm mt-2">No answer sheet provided by mentor.</p>
              )}
            </div>
            )}
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0B1437] text-slate-300 flex flex-col shadow-2xl z-20 hidden lg:flex rounded-r-[2rem] my-4 ml-4 overflow-hidden">
        
        {/* 1. Header */}
        <div className="p-8 flex items-center gap-4 border-b border-slate-700/50 shrink-0">
          {studentProfile.profilePic ? (
            <img src={studentProfile.profilePic} alt="Profile" className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-emerald-500/30" />
          ) : (
            <div className="bg-gradient-to-tr from-emerald-400 to-cyan-500 text-white w-12 h-12 flex items-center justify-center rounded-2xl font-black text-2xl shadow-lg shadow-emerald-500/30">
              S
            </div>
          )}
          <div>
            <h1 className="text-lg font-black text-white tracking-wide leading-tight">MathCom<br/>Mentor</h1>
          </div>
        </div>
        
        {/* 2. Navigation Links */}
        <div className="p-6 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            My Assignments
          </button>
          
          <button onClick={() => setActiveTab('announcements')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'announcements' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
            Notice Board
          </button>

          <button onClick={() => setActiveTab('calendar')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'calendar' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Calendar
          </button>
          
          <button onClick={() => setActiveTab('library')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'library' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            Study Materials
          </button>

          <button onClick={() => setActiveTab('messages')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'messages' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            Message Mentor
          </button>

          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Settings
          </button>
        </div>
        
        {/* 3. Sign Out */}
        <div className="p-6 border-t border-slate-700/50 shrink-0">
          <button onClick={handleLogout} className="w-full flex justify-center items-center gap-2 bg-slate-800 hover:bg-rose-500 text-slate-300 hover:text-white px-5 py-4 rounded-2xl font-bold transition-all shadow-sm group">
            <svg className="w-5 h-5 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto scroll-smooth p-6 lg:p-10">
        <div className="max-w-[1600px] mx-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
            <div>
              <h1 className="text-4xl font-black text-[#1B2559]">Welcome back, {studentProfile.name} 👋</h1>
              <p className="text-[#A3AED0] mt-2 font-bold tracking-wide">Stay on top of your coursework and grades.</p>
            </div>
            
            <div className="flex gap-4 mt-6 md:mt-0">
              <div className="bg-white px-6 py-4 rounded-3xl shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4">
                <div className="bg-amber-50 p-3 rounded-full text-amber-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <p className="text-xs font-black text-[#A3AED0] uppercase tracking-wider">To Do</p>
                  <p className="text-2xl font-black text-[#1B2559]">{assignments.filter(h => h.status === 'Pending').length}</p>
                </div>
              </div>
              <div className="bg-white px-6 py-4 rounded-3xl shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4">
                <div className="bg-emerald-50 p-3 rounded-full text-emerald-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <p className="text-xs font-black text-[#A3AED0] uppercase tracking-wider">Graded</p>
                  <p className="text-2xl font-black text-[#1B2559]">{assignments.filter(h => h.status === 'Graded').length}</p>
                </div>
              </div>
              
              <div className="bg-white px-6 py-4 rounded-3xl shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4">
                <div className="bg-indigo-50 p-3 rounded-full text-indigo-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                </div>
                <div>
                  <p className="text-xs font-black text-[#A3AED0] uppercase tracking-wider">Avg Score</p>
                  <p className="text-2xl font-black text-[#1B2559]">
                    {assignments.filter(h => h.status === 'Graded').length > 0 ? 
                      (assignments.filter(h => h.status === 'Graded').reduce((acc, curr) => acc + (curr.grading?.score || 0), 0) / assignments.filter(h => h.status === 'Graded').length).toFixed(1) 
                      : 0}%
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* VIEW 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-400 w-2 h-8 rounded-full"></div>
                <h2 className="text-2xl font-black text-[#1B2559]">My Homework</h2>
              </div>
              <div className="relative w-full md:w-72">
                <svg className="w-5 h-5 absolute left-4 top-4 text-[#A3AED0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input type="text" placeholder="Search my tasks..." 
                  className="w-full py-3 pl-12 pr-4 bg-[#F4F7FE] rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-[#1B2559]"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAssignments.map(hw => {
                const isLate = new Date() > new Date(hw.dueDate);

                return (
                  <div key={hw._id} className="bg-[#F4F7FE] p-6 rounded-3xl flex flex-col justify-between hover:shadow-lg transition-all border border-transparent hover:border-emerald-200 group">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider
                          ${hw.status === 'Pending' ? 'bg-white text-slate-500 shadow-sm' : 
                            hw.status === 'Submitted' ? 'bg-amber-100 text-amber-700 shadow-sm' : 'bg-emerald-100 text-emerald-700 shadow-sm'}`}>
                          {hw.status}
                        </span>
                        <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider bg-white shadow-sm
                          ${hw.difficulty === 'Easy' ? 'text-emerald-500' : hw.difficulty === 'Medium' ? 'text-amber-500' : 'text-rose-500'}`}>
                          {hw.difficulty}
                        </span>
                      </div>
                      
                      <h3 className="font-black text-[#1B2559] text-xl mb-1 group-hover:text-emerald-600 transition-colors">{hw.title}</h3>
                      <p className="text-sm font-bold text-[#A3AED0] mb-4 flex items-center gap-1.5">
                        Format: <span className="text-slate-600">{hw.type}</span>
                      </p>

                      <div className={`p-3 rounded-2xl mb-6 flex items-center gap-3 font-bold text-sm
                        ${isLate && hw.status === 'Pending' ? 'bg-rose-100 text-rose-700' : 'bg-white text-slate-600 shadow-sm'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {new Date(hw.dueDate).toLocaleString()}
                        {isLate && hw.status === 'Pending' && <span className="ml-auto bg-rose-500 text-white text-[10px] px-2 py-1 rounded-lg">OVERDUE</span>}
                      </div>
                    </div>

                    <button onClick={() => setModalTask(hw)} 
                      className={`w-full py-4 rounded-2xl font-black transition-all shadow-md transform hover:-translate-y-1
                        ${hw.status === 'Graded' ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30' : 
                          hw.status === 'Submitted' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30' : 
                          'bg-[#1B2559] hover:bg-indigo-600 text-white shadow-indigo-500/30'}`}>
                      {hw.status === 'Graded' ? 'View Grades' : hw.status === 'Submitted' ? 'View Details' : 'Open Task'}
                    </button>
                  </div>
                );
              })}

              {filteredAssignments.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-6xl mb-4 opacity-50">🌴</div>
                  <h3 className="text-[#1B2559] font-black text-2xl mb-1">You are all caught up!</h3>
                  <p className="text-[#A3AED0] font-bold">No assignments have been pushed to you yet.</p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* VIEW 2: SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="animate-fade-in max-w-2xl mx-auto">
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                  <div className="bg-emerald-500 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#1B2559]">Profile Settings</h2>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      {settingsForm.profilePic ? (
                        <img src={settingsForm.profilePic} alt="Profile" className="w-24 h-24 rounded-3xl object-cover shadow-md" />
                      ) : (
                        <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center text-4xl shadow-md">👤</div>
                      )}
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-3xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicUpload} />
                        <span className="text-xs font-bold">Upload</span>
                      </label>
                    </div>
                    <div>
                      <h3 className="font-black text-[#1B2559] text-lg">Profile Picture</h3>
                      <p className="text-sm font-bold text-[#A3AED0]">JPG, PNG under 2MB</p>
                      {isProfileUploading && <p className="text-xs text-amber-500 mt-1">Uploading...</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Display Name</label>
                    <input type="text" className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/20 font-bold text-[#1B2559]" 
                      value={settingsForm.name} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} />
                  </div>

                  <button onClick={handleSaveSettings} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg transition-transform hover:-translate-y-1">
                    Save Profile Update
                  </button>
                </div>
              </div>
            </div>
          )}
        {/* STUDENT VIEW: ANNOUNCEMENTS TAB */}
          {activeTab === 'announcements' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                <div className="bg-amber-500 w-2 h-8 rounded-full"></div>
                <h2 className="text-2xl font-black text-[#1B2559]">Notice Board 📢</h2>
              </div>
              
              <div className="space-y-6">
                {announcements.map(ann => {
                  const isRead = ann.readBy.includes(userId); 
                  
                  return (
                    <div key={ann._id} className={`p-6 rounded-3xl border-2 transition-all ${isRead ? 'bg-[#F4F7FE] border-transparent' : 'bg-amber-50 border-amber-200 shadow-md'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-bold text-[#A3AED0]">{new Date(ann.createdAt).toLocaleString()}</span>
                        {!isRead && <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">New Notice</span>}
                      </div>
                      
                      <p className="text-[#1B2559] font-black whitespace-pre-wrap mb-4 text-lg">{ann.content}</p>
                      
                      {ann.imageUrl && (
                        <img src={ann.imageUrl} alt="Announcement" className="w-full max-w-md rounded-2xl mb-4 border-4 border-white shadow-sm" />
                      )}
                      
                      {!isRead ? (
                        <button onClick={() => markAnnouncementAsRead(ann._id)} className="mt-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl transition-transform hover:-translate-y-1 shadow-lg text-sm flex items-center gap-2">
                          Mark as Read ✓
                        </button>
                      ) : (
                        <p className="mt-2 text-emerald-500 text-sm font-black flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          Acknowledged
                        </p>
                      )}
                    </div>
                  );
                })}
                
                {announcements.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <div className="text-6xl mb-4 opacity-50">📢</div>
                    <p className="text-[#1B2559] font-black text-xl mb-1">All caught up!</p>
                    <p className="text-[#A3AED0] font-bold">No new announcements from your mentor.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (() => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            const getAssignmentsForDay = (day) => {
              return assignments.filter(hw => {
                const d = new Date(hw.dueDate);
                return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
              });
            };

            return (
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in">
                
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-slate-100 pb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 w-2 h-8 rounded-full"></div>
                    <h2 className="text-2xl font-black text-[#1B2559]">Monthly Planner</h2>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-[#F4F7FE] p-2 rounded-2xl">
                    <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-3 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-sm">
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <h3 className="text-xl font-black text-[#1B2559] min-w-[160px] text-center">
                      {monthNames[month]} {year}
                    </h3>
                    <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-3 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-sm">
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 md:gap-4 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-black text-[#A3AED0] uppercase text-xs tracking-wider">{day}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2 md:gap-4">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[100px] md:min-h-[120px] bg-slate-50/50 rounded-2xl border border-dashed border-slate-200"></div>
                  ))}
                  
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayAssignments = getAssignmentsForDay(day);
                    const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

                    return (
                      <div key={day} className={`min-h-[100px] md:min-h-[120px] p-2 md:p-3 rounded-2xl border transition-all 
                        ${isToday ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                        
                        <div className={`text-xs md:text-sm font-black w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full mb-2 
                          ${isToday ? 'bg-indigo-500 text-white shadow-md' : 'text-[#1B2559]'}`}>
                          {day}
                        </div>
                        
                        <div className="space-y-1.5 overflow-y-auto max-h-[70px] custom-scrollbar pr-1">
                          {dayAssignments.map(hw => (
                            <div key={hw._id} 
                              onClick={() => setModalTask(hw)}
                              className={`text-[9px] md:text-[10px] font-bold p-1.5 md:p-2 rounded-lg truncate cursor-pointer transition-transform hover:scale-105 shadow-sm
                              ${hw.status === 'Graded' ? 'bg-emerald-100 text-emerald-700' : 
                                hw.status === 'Submitted' ? 'bg-amber-100 text-amber-700' : 
                                'bg-[#1B2559] text-white'}`}
                              title={hw.title}
                            >
                              {hw.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 flex items-center justify-center gap-6 text-xs font-bold text-slate-500">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#1B2559]"></span> Pending</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-300"></span> Under Review</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-300"></span> Graded</div>
                </div>

              </div>
            );
          })()}

          {/* STUDENT VIEW: MESSAGES TAB */}
          {activeTab === 'messages' && (
            <div className="bg-white p-6 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] h-[700px] flex flex-col animate-fade-in relative overflow-hidden">
              <div className="bg-emerald-500 text-white p-6 rounded-2xl mb-4 font-black flex items-center gap-3 shadow-lg shadow-emerald-500/20">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">👨‍🏫</div>
                <div>
                  <h2 className="text-xl">Mentor Support Chat</h2>
                  <p className="text-xs font-medium text-emerald-100">Ask your doubts directly here!</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#F4F7FE]/50 rounded-2xl border border-slate-100">
                {messages.map(msg => (
                  <div key={msg._id} className={`flex ${msg.sender === userId ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${msg.sender === userId ? 'bg-emerald-500 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}`}>
                      <p className="font-bold">{msg.content}</p>
                      <span className={`text-[10px] block mt-1 ${msg.sender === userId ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && <div className="text-center text-slate-400 font-bold mt-20"><p className="text-4xl mb-2">👋</p><p>No messages yet. Drop your mentor a question!</p></div>}
              </div>

              <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <input type="text" className="flex-1 p-5 bg-[#F4F7FE] border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/20 font-bold text-[#1B2559]" 
                  placeholder="Type your question..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                <button className="px-8 bg-[#1B2559] hover:bg-emerald-600 text-white font-black rounded-2xl transition-all shadow-lg transform hover:-translate-y-1">Send</button>
              </form>
            </div>
          )}

          {/* STUDENT VIEW: STUDY LIBRARY */}
          {activeTab === 'library' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in">
              
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                <div className="bg-cyan-500 w-2 h-8 rounded-full"></div>
                <h2 className="text-2xl font-black text-[#1B2559]">Study Materials Hub 📚</h2>
              </div>
              <p className="text-slate-500 font-bold mb-8">Access syllabus files, reference links, and study guides provided by your mentor anytime. These are not graded tasks.</p>
                
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {resources.map(res => (
                  <div key={res._id} className="p-6 bg-white border-2 border-slate-100 hover:border-cyan-300 rounded-3xl transition-all shadow-sm hover:shadow-xl flex flex-col justify-between group">
                    <div>
                      <div className="flex gap-2 mb-4">
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm
                          ${res.type === 'Document' ? 'bg-rose-100 text-rose-700' : res.type === 'Video Link' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'}`}>
                          {res.type}
                        </span>
                      </div>
                      <h3 className="text-[#1B2559] font-black text-xl mb-2 group-hover:text-cyan-600 transition-colors">{res.title}</h3>
                      {res.description && <p className="text-sm font-bold text-[#A3AED0] mb-4 line-clamp-3">{res.description}</p>}
                    </div>
                    
                    <button onClick={() => {
                        const a = document.createElement('a');
                        a.href = res.url;
                        a.target = "_blank";
                        if (res.type === 'Document') a.download = `${res.title.replace(/\s+/g, '_')}`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }} 
                      className="mt-6 w-full py-3.5 bg-[#F4F7FE] text-[#1B2559] hover:bg-cyan-500 hover:text-white font-black rounded-xl transition-all shadow-sm flex justify-center items-center gap-2 transform group-hover:-translate-y-1">
                      {res.type === 'Document' ? '⬇️ Download Material' : '🔗 Access Link'}
                    </button>
                  </div>
                ))}
                
                {resources.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-6xl mb-4 opacity-50">🗂️</div>
                    <h3 className="text-[#1B2559] font-black text-2xl mb-1">Library is empty!</h3>
                    <p className="text-[#A3AED0] font-bold">Your mentor hasn't uploaded any study materials yet.</p>
                  </div>
                )}
              </div>

            </div>
          )} 

        </div>
      </div>
    </div>
  );
}