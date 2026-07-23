import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  // Tab Navigation
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'dashboard';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [assignments, setAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // UI States
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [modalTask, setModalTask] = useState(null); 
  const [isLoading, setIsLoading] = useState(true); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Submission Form State
  const [submitForm, setSubmitForm] = useState({ answerFileUrl: '', answerText: '' });
  const [mcqAnswers, setMcqAnswers] = useState({}); 
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  //  Student Profile & Settings State
  const [studentProfile, setStudentProfile] = useState({ name: 'Scholar', profilePic: '', studentId: '' });
  const [settingsForm, setSettingsForm] = useState({ name: '', profilePic: '' });
  const [isProfileUploading, setIsProfileUploading] = useState(false);
  const [userId, setUserId] = useState(null); 
  const [announcements, setAnnouncements] = useState([]);

  // Feedback State & Function
  const [feedbackForm, setFeedbackForm] = useState({ feature: 'My Homework', message: '', rating: 0 });
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (feedbackForm.rating === 0) return showToast("Please provide a star rating", "error");
    if (!feedbackForm.message) return showToast("Feedback message is required", "error");
    try {
      await api.post('/feedback', feedbackForm);
      showToast("Feedback submitted successfully! Thank you.");
      setFeedbackForm({ feature: 'My Homework', message: '', rating: 0 });
      setHoveredStar(0);
    } catch (err) {
      showToast("Failed to submit feedback", "error");
    }
  };

// Chat States
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatRoom, setChatRoom] = useState('admin'); 

  // Study Library States
  const [resources, setResources] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [driveLinks, setDriveLinks] = useState([]); 
  const [topics, setTopics] = useState([]); 

  const [plannerSessions, setPlannerSessions] = useState([]);

  const [topicSearchTerm, setTopicSearchTerm] = useState('');
  const [topicSortConfig, setTopicSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  const handleSortTopics = (key) => {
    let direction = 'asc';
    if (topicSortConfig.key === key && topicSortConfig.direction === 'asc') direction = 'desc';
    setTopicSortConfig({ key, direction });
  };

  const processedTopics = topics.filter(topic => {
    if (topic.studentId && topic.studentId !== 'all') {
      const assignedId = typeof topic.studentId === 'object' ? topic.studentId._id : topic.studentId;
      if (assignedId !== userId) return false;
    }
    return (topic.topicName || '').toLowerCase().includes(topicSearchTerm.toLowerCase()) || 
           (topic.areaName || '').toLowerCase().includes(topicSearchTerm.toLowerCase()) ||
           (topic.grade || '').toLowerCase().includes(topicSearchTerm.toLowerCase());
  }).sort((a, b) => {
    if (!topicSortConfig || !topicSortConfig.key) return 0;
    if (topicSortConfig.key === 'yearLevel') {
      const numA = parseInt((a.yearLevel || '').toString().replace(/[^0-9]/g, ''), 10) || 0;
      const numB = parseInt((b.yearLevel || '').toString().replace(/[^0-9]/g, ''), 10) || 0;
      if (numA < numB) return topicSortConfig.direction === 'asc' ? -1 : 1;
      if (numA > numB) return topicSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    }
    if (topicSortConfig.key === 'sparxCode') {
      const valA = (a.sparxCode || '').toString();
      const valB = (b.sparxCode || '').toString();
      const compareResult = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
      return topicSortConfig.direction === 'asc' ? compareResult : -compareResult;
    }
    const valA = (a[topicSortConfig.key] || '').toString().toLowerCase();
    const valB = (b[topicSortConfig.key] || '').toString().toLowerCase();
    if (valA < valB) return topicSortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return topicSortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // NEW FETCH FUNCTION FOR TOPICS
  const fetchTopics = async () => {
    try {
      const res = await api.get('/topics');
      setTopics(res.data);
    } catch (e) { console.error("Error fetching topics"); }
  };

  const fetchSchemes = async () => {
    try {
      const res = await api.get('/scheme');
      setSchemes(res.data);
    } catch (e) { console.error("Error fetching schemes"); }
  };
  const fetchDriveLinks = async () => {
    try {
      const res = await api.get('/drive-links');
      setDriveLinks(res.data);
    } catch (e) { console.error("Error fetching drive links"); }
  };
  const fetchPlanner = async () => {
    try {
      const res = await api.get('/planner');
      setPlannerSessions(res.data);
    } catch (e) { console.error("Error fetching class planner"); }
  };

  useEffect(() => {
    fetchAssignments();
    fetchProfile(); 
    fetchAnnouncements(); 
    fetchResources();
    fetchSchemes(); 
    fetchDriveLinks();
    fetchPlanner();
    fetchTopics();
    
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
      
      const displayName = res.data.adminOverrides?.name || res.data.name;

      setStudentProfile({ 
        name: displayName, 
        profilePic: res.data.profilePic || '', 
        studentId: res.data.studentId, 
        yearGroup: res.data.yearGroup || 'Y?',
        boardName: res.data.boardName || '',
        schoolName: res.data.adminOverrides?.schoolName || res.data.schoolName || '',
        city: res.data.adminOverrides?.city || res.data.city || ''
      });
      
      setSettingsForm({ name: displayName, profilePic: res.data.profilePic || '' });
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
      showToast("Error fetching your homework.", "error");
    }
  };

  const fetchMessages = async (room = chatRoom) => {
    try {
      const url = room === 'all' ? '/messages/all' : '/messages';
      const res = await api.get(url); 
      setMessages(res.data);
    } catch (e) { console.error("Error fetching messages"); }
  };

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages(chatRoom);
    }
  }, [activeTab, chatRoom]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    try {
      const payload = { content: chatInput };
      if (chatRoom === 'all') payload.receiverId = 'all';
      
      await api.post('/messages', payload); 
      setChatInput('');
      fetchMessages(chatRoom); 
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
      showToast('🎉 Homework submitted successfully!');
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
    !hw.isTest && hw.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredTests = assignments.filter(hw => 
    hw.isTest && hw.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Calculate Student Analytics
  const gradedHw = assignments.filter(h => h.status === 'Graded');
  const pendingHw = assignments.filter(h => h.status === 'Pending');
  let totalEarned = 0; let totalPossible = 0;
  gradedHw.forEach(h => {
    if(h.grading?.score != null && h.grading?.totalScore) {
        totalEarned += h.grading.score;
        totalPossible += h.grading.totalScore;
    }
  });
  const avgScore = totalPossible > 0 ? ((totalEarned / totalPossible) * 100).toFixed(1) : 0;

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

  const handleConfidenceChange = async (topicId, newConfidence) => {
    try {
      await api.put(`/topics/${topicId}`, { studentConfidence: newConfidence });
      fetchTopics();
      showToast("Confidence level updated!");
    } catch (e) {
      showToast("Failed to update confidence.", "error");
    }
  };

  // Save Profile Settings to Database
  const handleSaveSettings = async () => {
    try {
      const res = await api.put('/auth/profile', settingsForm);
      
      setStudentProfile(prev => ({ 
        ...prev, 
        name: res.data.user.name, 
        profilePic: res.data.user.profilePic || '' 
      }));
      
      showToast("Profile Settings Saved!");
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
                <h4 className="text-xs font-black text-[#A3AED0] uppercase tracking-wide mb-4">Homework Details</h4>
                
                {modalTask.studentInstructions && (
                  <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-xl mb-4">
                    <p className="text-xs font-black text-indigo-800 uppercase tracking-wide mb-1">Teacher's Instructions</p>
                    <p className="text-indigo-900 font-medium text-sm whitespace-pre-wrap">{modalTask.studentInstructions}</p>
                  </div>
                )}
                
                {modalTask.type === 'File' && modalTask.fileUrl && (
  <div className="flex flex-col gap-4 w-full">
    <p className="text-sm font-black text-[#1B2559] uppercase tracking-wide">Attachment Preview</p>
    
    <div className="w-full max-h-[400px] overflow-auto border-2 border-slate-200 rounded-2xl bg-white p-2 shadow-inner">
      {modalTask.fileUrl.includes('image') || modalTask.fileUrl.startsWith('data:image') ? (
  <img src={modalTask.fileUrl} alt="Homework Attachment" className="w-full h-auto rounded-xl object-contain" />
) : modalTask.fileUrl.includes('pdf') || modalTask.fileUrl.startsWith('data:application/pdf') ? (
  <iframe src={modalTask.fileUrl} className="w-full h-[500px] border-0 rounded-xl" title="PDF Preview"></iframe>
) : (
  <p className="text-center text-slate-500 py-10 font-bold">Preview not available for this format.</p>
)}
    </div>

    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
      <p className="font-bold text-indigo-800 text-sm">Do you want to download this file?</p>
      <button type="button" onClick={() => {
    const initials = (studentProfile.name || 'Unknown').split(' ')[0];
    const yearGroup = studentProfile.yearGroup || 'Y?';
    const formattedTitle = (modalTask.title || '').toUpperCase();

    let ext = '.pdf';
    if (modalTask.fileUrl) {
        if (modalTask.fileUrl.includes('image/jpeg') || modalTask.fileUrl.includes('image/jpg')) ext = '.jpg';
        else if (modalTask.fileUrl.includes('image/png')) ext = '.png';
    }
    const fileName = `${initials} - ${yearGroup} - ${formattedTitle}${ext}`;

    const a = document.createElement('a');
    a.href = modalTask.fileUrl;
    a.download = fileName;
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
              modalTask.type !== 'MCQ' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* NEW LATE WARNING FOR THE STUDENT */}
                  {new Date() > new Date(modalTask.dueDate) && (
                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl mb-4 text-center">
                      <p className="text-rose-600 font-black text-sm">⚠️ This homework is past due. Your submission will be marked as LATE.</p>
                    </div>
                  )}

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
                <p className="text-amber-600 font-medium">You have submitted your work. Waiting for your teacher to grade it.</p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl text-center flex flex-col items-center">
                <p className="text-emerald-600 font-bold text-sm mb-4 bg-emerald-100/50 px-4 py-2 rounded-full">Note: Original homework content has been removed post-grading.</p>

                <div className="w-auto px-6 h-20 bg-emerald-500 text-white rounded-full inline-flex items-center justify-center text-3xl font-black mb-4 shadow-lg shadow-emerald-500/30">
                {modalTask.grading?.score != null ? `${modalTask.grading.score} / ${modalTask.grading.totalScore}` : 'N/A'}
              </div>
              <h4 className="text-xl font-black text-emerald-800 mb-2">Graded Successfully!</h4>
              
              {(modalTask.grading?.adminAnswerSheetUrl || modalTask.driveLink) ? (
                <div className="flex flex-col gap-3 w-full mt-6 text-left">
                  <h4 className="text-xs font-black text-emerald-600 uppercase tracking-wide">Teacher's Marked/Checked work</h4>
                  
                  {/* 1. Show the File Attachment if it exists */}
                  {modalTask.grading?.adminAnswerSheetUrl && (
                    <>
                      <div className="w-full max-h-[400px] overflow-auto border-2 border-emerald-200 rounded-2xl bg-white p-2 shadow-inner">
                        {modalTask.grading.adminAnswerSheetUrl.includes('image') || modalTask.grading.adminAnswerSheetUrl.startsWith('data:image') ? (
                          <img src={modalTask.grading.adminAnswerSheetUrl} alt="Answer Sheet" className="w-full h-auto rounded-xl object-contain" />
                        ) : modalTask.grading.adminAnswerSheetUrl.includes('pdf') || modalTask.grading.adminAnswerSheetUrl.startsWith('data:application/pdf') ? (
                          <iframe src={modalTask.grading.adminAnswerSheetUrl} className="w-full h-[500px] border-0 rounded-xl" title="PDF Preview"></iframe>
                        ) : (
                          <p className="text-center text-slate-500 py-10 font-bold">Preview not available for this format.</p>
                        )}
                      </div>

                      <button type="button" onClick={() => {
                        const initials = (studentProfile.name || 'Unknown').split(' ')[0];
                        const yearGroup = studentProfile.yearGroup || 'Y?';
                        
                        let formattedTitle = (modalTask.title || '').toUpperCase()
                            .replace(' HW ', ' MW ')
                            .replace(' TEST ', ' MW ');
                            
                        let ext = '.pdf';
                        if (modalTask.grading.adminAnswerSheetUrl) {
                            if (modalTask.grading.adminAnswerSheetUrl.includes('image/jpeg') || modalTask.grading.adminAnswerSheetUrl.includes('image/jpg')) ext = '.jpg';
                            else if (modalTask.grading.adminAnswerSheetUrl.includes('image/png')) ext = '.png';
                        }
                        const fileName = `${initials} - ${yearGroup} - ${formattedTitle}${ext}`;

                        const a = document.createElement('a');
                        a.href = modalTask.grading.adminAnswerSheetUrl;
                        a.download = fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                        className="w-full mt-2 px-6 py-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-black rounded-2xl transition-all border-2 border-dashed border-emerald-200 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Download Marked/Checked work
                      </button>
                    </>
                  )}

                  {/* 2. Show the Drive Link if it exists */}
                  {modalTask.driveLink && (
                    <a href={modalTask.driveLink} target="_blank" rel="noopener noreferrer" 
                      className="w-full mt-2 px-6 py-4 bg-blue-50 text-blue-700 hover:bg-blue-100 font-black rounded-2xl transition-all border-2 border-dashed border-blue-200 flex items-center justify-center gap-2 shadow-sm transform hover:-translate-y-1">
                      ☁️ Open Marked Work in Drive
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-emerald-600 font-medium text-sm mt-2">No marked/checked work provided by teacher.</p>
              )}
            </div>
            )}
          </div>
        </div>
      )}

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#0B1437]/60 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`w-72 bg-[#0B1437] text-slate-300 flex flex-col shadow-2xl z-50 fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 lg:flex rounded-r-[2rem] my-4 lg:ml-4 overflow-hidden`}>
        
        {/* 1. Header */}
        <div 
          onClick={() => { navigate('/student-dashboard/settings'); setIsSidebarOpen(false); }}
          className="p-8 flex items-center gap-4 border-b border-slate-700/50 shrink-0 cursor-pointer group hover:bg-slate-800/50 transition-colors"
          title="Go to Settings to Upload Profile Picture"
        >
          <div className="relative">
            {studentProfile.profilePic ? (
              <img src={studentProfile.profilePic} alt="Profile" className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-emerald-500/30 group-hover:opacity-75 transition-opacity" />
            ) : (
              <div className="bg-gradient-to-tr from-emerald-400 to-cyan-500 text-white w-12 h-12 flex items-center justify-center rounded-2xl font-black text-2xl shadow-lg shadow-emerald-500/30 group-hover:opacity-75 transition-opacity">
                S
              </div>
            )}
            
            <div className="absolute inset-0 bg-[#0B1437]/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            
            {!studentProfile.profilePic && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-[#0B1437]"></span>
              </span>
            )}
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-wide leading-tight group-hover:text-emerald-400 transition-colors">MathCom<br/>Mentors</h1>
            
            {!studentProfile.profilePic && (
              <p className="text-[10px] text-emerald-400 font-bold mt-1 group-hover:underline">Click to upload your photo</p>
            )}
          </div>
        </div>
        
        {/* 2. Navigation Links */}
        <div className="relative flex-1 flex flex-col overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#0B1437] to-transparent pointer-events-none z-10"></div>
          
          <div className="p-6 space-y-3 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button onClick={() => { navigate('/student-dashboard/dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              My Homework
            </button>
            
            <button onClick={() => { navigate('/student-dashboard/tests'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'tests' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              My Tests
            </button>

            <button onClick={() => { navigate('/student-dashboard/scheme'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'scheme' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Lesson Schedule
            </button>

            <button onClick={() => { navigate('/student-dashboard/topics'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'topics' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              Topics Covered
            </button>

            <button onClick={() => { navigate('/student-dashboard/announcements'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'announcements' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
              Notice Board
            </button>

            <button onClick={() => { navigate('/student-dashboard/calendar'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'calendar' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Calendar
            </button>
            
            <button onClick={() => { navigate('/student-dashboard/library'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'library' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              Study Materials
            </button>

            <button onClick={() => { navigate('/student-dashboard/drive'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'drive' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
              Shared Drive
            </button>

            <button onClick={() => { navigate('/student-dashboard/messages'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'messages' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              Message Mentor
            </button>

            <button onClick={() => { navigate('/student-dashboard/settings'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Settings
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0B1437] to-transparent pointer-events-none z-10 flex items-end justify-center pb-1">
            <svg className="w-5 h-5 text-slate-500/60 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
        
        {/* 3. Sign Out */}
        <div className="p-6 border-t border-slate-700/50 shrink-0">
          <button onClick={() => { handleLogout(); setIsSidebarOpen(false); }} className="w-full flex justify-center items-center gap-2 bg-slate-800 hover:bg-rose-500 text-slate-300 hover:text-white px-5 py-4 rounded-2xl font-bold transition-all shadow-sm group">
            <svg className="w-5 h-5 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto scroll-smooth p-3 sm:p-6 lg:p-10 w-full overflow-x-hidden">
        <div className="max-w-[1600px] mx-auto">
          <div className="lg:hidden flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 w-10 h-10 flex items-center justify-center rounded-xl text-white font-bold text-xl">S</div>
              <h1 className="font-black text-[#1B2559] text-xl">Portal</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-100 rounded-lg text-[#1B2559] hover:bg-slate-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
          </div>
          
          {/* Header */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6">
  <div>
    <h1 className="text-4xl font-black text-[#1B2559]">Welcome back, {studentProfile.name} 👋</h1>
    <p className="text-[#A3AED0] font-bold tracking-wide mt-2">Stay on top of your coursework and grades.</p>
    
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {/* Original ID Badge */}
      <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black tracking-widest border border-indigo-200 flex items-center gap-2 w-fit shadow-sm">
        <span className="truncate">ID: {studentProfile.studentId}</span>
        <button onClick={() => {navigator.clipboard.writeText(studentProfile.studentId); showToast("ID Copied!");}} className="hover:text-indigo-900" title="Copy ID">
          📋
        </button>
      </div>

      {/* New Year Badge */}
      {studentProfile.yearGroup && studentProfile.yearGroup !== 'Y?' && (
        <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black tracking-widest border border-emerald-200 w-fit shadow-sm">
          {studentProfile.yearGroup}
        </div>
      )}

      {/* New Board Badge */}
      {studentProfile.boardName && (
        <div className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-xs font-black tracking-widest border border-sky-200 w-fit shadow-sm">
          {studentProfile.boardName}
        </div>
      )}

      {/* New School Badge */}
      {studentProfile.schoolName && (
        <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black tracking-widest border border-amber-200 w-fit shadow-sm">
          🏫 {studentProfile.schoolName}
        </div>
      )}

      {/* New City Badge */}
      {studentProfile.city && (
        <div className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-black tracking-widest border border-rose-200 w-fit shadow-sm">
          📍 {studentProfile.city}
        </div>
      )}
    </div>
  </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full xl:w-auto shrink-0">
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
                    {avgScore}%
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
                  <p className="text-[#A3AED0] font-bold">No homework have been pushed to you yet.</p>
                </div>
              )}
            </div>
          </div>
          )}

          {/* VIEW 1.5: TESTS TAB */}
          {activeTab === 'tests' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                <div className="bg-rose-400 w-2 h-8 rounded-full"></div>
                <h2 className="text-2xl font-black text-[#1B2559]">Scheduled Tests</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTests.map(hw => {
                  const isOpen = new Date() >= new Date(hw.startDate);
                  const isLate = new Date() > new Date(hw.dueDate);

                  return (
                    <div key={hw._id} className={`p-6 rounded-3xl flex flex-col justify-between transition-all border-2 
                      ${isOpen ? 'bg-[#F4F7FE] border-transparent hover:border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider bg-rose-100 text-rose-700 shadow-sm`}>
                            TEST
                          </span>
                        </div>
                        
                        <h3 className="font-black text-[#1B2559] text-xl mb-1">{hw.title}</h3>
                        
                        <div className="mt-4 flex flex-col gap-2 text-xs font-black">
                          <div className={`p-2 rounded-xl ${isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                            🗓️ Opens: {new Date(hw.startDate).toLocaleString()}
                          </div>
                          <div className={`p-2 rounded-xl ${isLate && hw.status === 'Pending' ? 'bg-rose-100 text-rose-700' : 'bg-white text-slate-600'}`}>
                            ⏰ Closes: {new Date(hw.dueDate).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {isOpen ? (
                        <button onClick={() => setModalTask(hw)} 
                          className={`w-full mt-6 py-4 rounded-2xl font-black transition-all shadow-md
                            ${hw.status === 'Graded' ? 'bg-emerald-500 text-white' : 
                              hw.status === 'Submitted' ? 'bg-amber-500 text-white' : 
                              'bg-[#1B2559] hover:bg-rose-600 text-white transform hover:-translate-y-1'}`}>
                          {hw.status === 'Graded' ? 'View Test Grades' : hw.status === 'Submitted' ? 'Under Review' : 'Start Test Now'}
                        </button>
                      ) : (
                        <button disabled className="w-full mt-6 py-4 rounded-2xl font-black bg-slate-200 text-slate-400 cursor-not-allowed flex items-center justify-center gap-2">
                          🔒 Locked until Date
                        </button>
                      )}
                    </div>
                  );
                })}
                {filteredTests.length === 0 && (
                  <p className="col-span-full text-center font-bold text-slate-400 py-10">No tests scheduled for you at this time.</p>
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
                    {/* 1. Avatar (Removed the hidden hover overlay) */}
                    <div className="relative shrink-0">
                      {settingsForm.profilePic ? (
                        <img src={settingsForm.profilePic} alt="Profile" className="w-24 h-24 rounded-3xl object-cover shadow-md" />
                      ) : (
                        <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center text-4xl shadow-md border-2 border-dashed border-slate-300">👤</div>
                      )}
                    </div>
                    
                    {/* 2. Text and Explicit Upload Button */}
                    <div className="flex flex-col items-start gap-2">
                      <div>
                        <h3 className="font-black text-[#1B2559] text-lg">Profile Picture</h3>
                        <p className="text-sm font-bold text-[#A3AED0]">JPG, PNG under 2MB</p>
                      </div>
                      
                      {/* Highly visible Upload button */}
                      <label className="bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100 px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-colors shadow-sm inline-flex items-center gap-2 mt-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicUpload} />
                        Choose Photo
                      </label>

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

              {/* Platform Feedback Submission */}
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] mt-8 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-bl-full -z-0"></div>
                
                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6 relative z-10">
                  <div className="bg-sky-500 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#1B2559]">Rate Your Experience ✨</h2>
                </div>

                <form onSubmit={handleFeedbackSubmit} className="space-y-6 flex flex-col h-full relative z-10">
                  <p className="text-sm font-bold text-slate-500">Help us improve the MathCom Mentors platform! Select a specific feature below, give it a star rating, and leave your thoughts.</p>

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
                    
                    <div className="flex flex-col sm:flex-row gap-6">
                      {/* Feature Selector */}
                      <div className="space-y-2 flex-1">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Which Feature?</label>
                        <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-[#1B2559] focus:ring-4 focus:ring-sky-500/20 transition-all cursor-pointer shadow-sm"
                          value={feedbackForm.feature} onChange={e => setFeedbackForm({...feedbackForm, feature: e.target.value})}>
                          <optgroup label="Student Dashboard Tabs">
                            <option value="My Homework">📝 My Homework</option>
                            <option value="My Tests">🎯 My Tests</option>
                            <option value="Lesson Schedule">📅 Lesson Schedule</option>
                            <option value="Topics Covered">📚 Topics Covered</option>
                            <option value="Notice Board">📢 Notice Board</option>
                            <option value="Calendar">🗓️ Calendar</option>
                            <option value="Study Materials">🗂️ Study Materials</option>
                            <option value="Shared Drive">☁️ Shared Drive</option>
                            <option value="Message Mentor">💬 Message Mentor</option>
                          </optgroup>
                          <optgroup label="General Feedback">
                            <option value="Login & App Access">🔐 Login & App Access</option>
                            <option value="Kind Words">💖 Kind Words & Praise</option>
                            <option value="Other / Suggestion">💡 Other / New Idea</option>
                          </optgroup>
                        </select>
                      </div>

                      {/* Star Rating */}
                      <div className="space-y-2 shrink-0">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide text-center block sm:text-left">Rating</label>
                        <div 
                          className="flex gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm justify-center"
                          onMouseLeave={() => setHoveredStar(0)}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setFeedbackForm({...feedbackForm, rating: star})}
                              onMouseEnter={() => setHoveredStar(star)}
                              className={`text-3xl transition-transform hover:scale-125 focus:outline-none ${(hoveredStar || feedbackForm.rating) >= star ? 'text-amber-400 drop-shadow-sm' : 'text-slate-200'}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Your Feedback</label>
                      <textarea className="w-full p-5 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-[#1B2559] min-h-[140px] focus:ring-4 focus:ring-sky-500/20 transition-all shadow-sm"
                        placeholder="Tell us what you love or what could be better..." required
                        value={feedbackForm.message} onChange={e => setFeedbackForm({...feedbackForm, message: e.target.value})} />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-5 bg-sky-500 hover:bg-sky-600 text-white font-black text-lg rounded-2xl shadow-lg shadow-sky-500/30 transition-transform hover:-translate-y-1 mt-4 flex items-center justify-center gap-2">
                    Send Feedback
                  </button>
                </form>
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
                    <p className="text-[#A3AED0] font-bold">No new announcements from your teacher.</p>
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
            const getSessionStatus = (session) => {
              const sessionDateStr = new Date(session.startDate).toDateString();
              const hasReport = schemes.some(report => 
                new Date(report.date).toDateString() === sessionDateStr && 
                report.studentId === session.studentId
              );
              
              if (hasReport) return 'logged';
              if (new Date(session.endDate) < new Date()) return 'missed';
              return 'upcoming';
            };

            const getSessionsForDay = (day) => {
              return plannerSessions.filter(session => {
                let isVisible = false;
                if (!session.studentId || session.studentId === 'all') {
                    if (session.yearGroupFilter && session.yearGroupFilter !== 'all') {
                        isVisible = studentProfile.yearGroup === session.yearGroupFilter;
                    } else {
                        isVisible = true;
                    }
                } else {
                    isVisible = session.studentId === userId;
                }

                if (!isVisible) return false;

                // Match Date
                const d = new Date(session.startDate);
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
                          
                          {/* 1. Map Class Sessions First */}
                          {getSessionsForDay(day).map(session => {
                            const status = getSessionStatus(session);
                            const colorClass = status === 'logged' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : status === 'missed' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200';
                            
                            return (
                            <div key={session._id} 
                              className={`text-[9px] md:text-[10px] font-bold p-1.5 md:p-2 rounded-lg shadow-sm border flex items-center gap-1 overflow-hidden ${colorClass}`} 
                              title={session.topic}>
                              <span className="shrink-0">🎥 {new Date(session.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              <span className="truncate">- {session.topic}</span>
                            </div>
                            );
                          })}

                          {/* 2. Map Assignments Below */}
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
            <div className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] h-[85vh] md:h-[700px] flex flex-col animate-fade-in relative overflow-hidden">
              
              {/* NEW CHAT TOGGLE BUTTONS */}
              <div className="flex gap-4 mb-4 shrink-0">
                <button 
                  onClick={() => setChatRoom('admin')}
                  className={`flex-1 py-3 rounded-2xl font-black transition-colors ${chatRoom === 'admin' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  👨‍🏫 Teacher Chat
                </button>
                <button 
                  onClick={() => setChatRoom('all')}
                  className={`flex-1 py-3 rounded-2xl font-black transition-colors ${chatRoom === 'all' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  🌍 Global Class Chat
                </button>
              </div>

              {/* Dynamic Header */}
              <div className={`${chatRoom === 'admin' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-indigo-500 shadow-indigo-500/20'} text-white p-6 rounded-2xl mb-4 font-black flex items-center justify-between shadow-lg transition-colors shrink-0`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
                    {chatRoom === 'admin' ? '👨‍🏫' : '🌍'}
                  </div>
                  <div>
                    <h2 className="text-xl">{chatRoom === 'admin' ? 'Teacher Support Chat' : 'Global Class Chat'}</h2>
                    <p className="text-xs font-medium text-white/80">
                      {chatRoom === 'admin' ? 'Ask your doubts directly here!' : 'Chat with your teacher and all other students!'}
                    </p>
                  </div>
                </div>
                <div className="bg-white/20 px-3 py-1.5 rounded-full border border-white/30 text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-sm shadow-sm">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                   Chats delete after 24 hours
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#F4F7FE]/50 rounded-2xl border border-slate-100">
                {messages.map(msg => {
                  const isMe = typeof msg.sender === 'object' ? msg.sender._id === userId : msg.sender === userId;

                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${isMe ? (chatRoom === 'admin' ? 'bg-emerald-500 text-white rounded-br-none' : 'bg-indigo-500 text-white rounded-br-none') : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}`}>
                        
                        {chatRoom === 'all' && !isMe && msg.sender?.name && (
                          <span className={`text-[10px] font-black mb-1 block uppercase ${chatRoom === 'admin' ? 'text-emerald-500' : 'text-indigo-500'}`}>
                            {msg.sender.registrationName || msg.sender.name}
                          </span>
                        )}

                        <p className="font-bold">{msg.content}</p>
                        <span className={`text-[10px] block mt-1 ${isMe ? (chatRoom === 'admin' ? 'text-emerald-100' : 'text-indigo-100') : 'text-slate-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <div className="text-center text-slate-400 font-bold mt-20">
                    <p className="text-4xl mb-2">👋</p>
                    <p>No messages yet. {chatRoom === 'admin' ? 'Drop your teacher a question!' : 'Say hello to the class!'}</p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="mt-4 flex flex-col sm:flex-row gap-3 shrink-0 w-full">
  <input type="text" className="w-full flex-1 p-4 sm:p-5 bg-[#F4F7FE] border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/20 font-bold text-[#1B2559]" 
    placeholder="Type your message..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
  <button className="w-full sm:w-auto px-8 py-4 bg-[#1B2559] hover:bg-violet-600 text-white font-black rounded-2xl transition-all shadow-lg transform hover:-translate-y-1">Send</button>
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
              <p className="text-slate-500 font-bold mb-8">Access syllabus files, reference links, and study guides provided by your teacher anytime. These are not graded tasks.</p>
                
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
                    <p className="text-[#A3AED0] font-bold">Your Teacher hasn't uploaded any study materials yet.</p>
                  </div>
                )}
              </div>

            </div>
          )} 
        {/* Lesson Schedule TAB */}
          {activeTab === 'scheme' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                <div className="bg-fuchsia-500 w-2 h-8 rounded-full"></div>
                <h2 className="text-2xl font-black text-[#1B2559]">Lesson Schedule</h2>
              </div>
              
              <div className="overflow-x-auto w-full max-w-full pb-4 relative">
                <table className="w-full min-w-[1000px] text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#F4F7FE] text-[#A3AED0] text-xs font-black uppercase tracking-wider">
                      <th className="p-5 rounded-tl-2xl">Date</th>
                      <th className="p-5">Lesson Title</th>
                      <th className="p-5">Status</th>
                      <th className="p-5">Time & Duration</th>
                      <th className="p-5 rounded-tr-2xl">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemes.filter(report => !report.studentId || report.studentId === 'all' || report.studentId === userId).map(report => (
                      <tr key={report._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-5">
                          <p className="font-bold text-[#1B2559]">
                            {new Date(report.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="p-5">
                          <p className="font-bold text-[#1B2559]">{report.title}</p>
                        </td>
                        <td className="p-5">
                          <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider shadow-sm ${report.classStatus === 'Class Taken' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {report.classStatus === 'Class Taken' ? '✅ Class Taken' : `❌ ${report.classStatus}`}
                          </span>
                        </td>
                        <td className="p-5">
                          {(report.classStatus === 'Class Taken' || report.classStatus === "Student didn't attend") && report.startTime && report.endTime ? (
                            <div>
                              <p className={`text-sm font-bold px-2 py-1 rounded-md inline-block mb-1 border ${report.classStatus === "Student didn't attend" ? 'text-rose-700 bg-rose-50 border-rose-100' : 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-100'}`}>
                                {report.startTime} - {report.endTime}
                              </p>
                              <p className="text-xs font-bold text-slate-500 block">
                                {report.classStatus === "Student didn't attend" ? "Teacher Waited" : "Duration"}: {
                                  (() => {
                                    const [sh, sm] = report.startTime.split(':').map(Number);
                                    const [eh, em] = report.endTime.split(':').map(Number);
                                    let diff = (eh * 60 + em) - (sh * 60 + sm);
                                    if(diff < 0) diff += 24 * 60;
                                    const h = Math.floor(diff/60);
                                    const m = diff % 60;
                                    return `${h > 0 ? h + ' hr ' : ''}${m > 0 ? m + ' min' : ''}`.trim();
                                  })()
                                }
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-5 w-[300px] whitespace-normal">
                          <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap" title="Description">
                            {report.description || '-'}
                          </p>
                          {report.classStatus === "Student didn't attend" && report.waitingTime && (
                            <div className="bg-rose-50 border-l-4 border-rose-500 p-2 rounded-r-lg mt-2">
                              <p className="text-[10px] font-black text-rose-800 uppercase mb-0.5">Teacher Waited For:</p>
                              <p className="text-rose-900 font-medium text-xs">{report.waitingTime}</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {schemes.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-10 text-slate-400 font-bold">No classes have been logged yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* STUDENT VIEW: SHARED DRIVE */}
          {activeTab === 'drive' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                <div className="bg-blue-500 w-2 h-8 rounded-full"></div>
                <h2 className="text-2xl font-black text-[#1B2559]">Shared Drive Links ☁️</h2>
              </div>
              <p className="text-slate-500 font-bold mb-8">Access folders and marked work hosted on Google Drive by your teacher.</p>
                
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
  {driveLinks.filter(link => link.targetAudience === 'all' || link.targetAudience === userId).map(link => (
    <div key={link._id} className="p-6 bg-white border-2 border-slate-100 hover:border-blue-300 rounded-3xl transition-all shadow-sm hover:shadow-xl flex flex-col justify-between group">
                    <div>
                      <div className="flex gap-2 mb-4">
                        <span className="text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm bg-blue-100 text-blue-700">
                          Google Drive
                        </span>
                      </div>
                      <h3 className="text-[#1B2559] font-black text-xl mb-4 group-hover:text-blue-600 transition-colors">{link.title}</h3>
                    </div>
                    
                    <button onClick={() => window.open(link.url, "_blank")} 
                      className="mt-6 w-full py-3.5 bg-[#F4F7FE] text-[#1B2559] hover:bg-blue-500 hover:text-white font-black rounded-xl transition-all shadow-sm flex justify-center items-center gap-2 transform group-hover:-translate-y-1">
                      🔗 Open Folder
                    </button>
                  </div>
                ))}
                
                {driveLinks.filter(link => link.targetAudience === 'all' || link.targetAudience === userId).length === 0 && (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-6xl mb-4 opacity-50">☁️</div>
                    <h3 className="text-[#1B2559] font-black text-2xl mb-1">No Links Shared</h3>
                    <p className="text-[#A3AED0] font-bold">Your teacher hasn't shared any Drive links with you yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* STUDENT VIEW: TOPICS COVERED TAB */}
          {activeTab === 'topics' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#1B2559]">Topics Covered 📚</h2>
                </div>
                <div className="relative">
                  <input type="text" placeholder="Search topics, area, or grade..." 
                    className="w-full sm:w-72 p-3 pl-4 bg-[#F4F7FE] border-none rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 font-bold text-[#1B2559]"
                    value={topicSearchTerm} onChange={e => setTopicSearchTerm(e.target.value)} />
                </div>
              </div>
              <p className="text-slate-500 font-bold mb-8">Review the curriculum areas and topics you have completed so far. Mark your confidence level so your teacher knows how you're feeling!</p>
              
              {processedTopics.some(topic => {
                const assignedId = typeof topic.studentId === 'object' ? topic.studentId?._id : topic.studentId;
                return (!assignedId || assignedId === 'all' || assignedId === userId) && !topic.studentConfidence;
              }) && (
                <div className="bg-amber-100 border-2 border-amber-400 text-amber-900 p-4 rounded-2xl mb-6 font-bold flex items-center gap-3 animate-pulse">
                  <span className="text-2xl">🚨</span>
                  Action Required: You have topics missing a confidence level! Please mark your confidence for the highlighted topics below.
                </div>
              )}

              <div className="overflow-x-auto w-full max-w-full pb-4 relative max-h-[600px] custom-scrollbar">
                <table className="w-full min-w-[800px] text-left border-collapse whitespace-nowrap">
                  <thead>
                      <tr className="bg-indigo-600 text-white text-xs font-black uppercase tracking-wider sticky top-0 z-10 align-top shadow-sm">
                        <th className="p-4 rounded-tl-2xl cursor-pointer hover:bg-indigo-700 transition-colors" onClick={() => handleSortTopics('areaName')}>
                          Area {topicSortConfig.key === 'areaName' ? (topicSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-indigo-700 transition-colors leading-tight" onClick={() => handleSortTopics('topicName')}>
                          Topic<br/>Name {topicSortConfig.key === 'topicName' ? (topicSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-indigo-700 transition-colors" onClick={() => handleSortTopics('grade')}>
                          Grade {topicSortConfig.key === 'grade' ? (topicSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-indigo-700 transition-colors leading-tight" onClick={() => handleSortTopics('yearLevel')}>
                          Year<br/>Level {topicSortConfig.key === 'yearLevel' ? (topicSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 leading-tight cursor-pointer hover:bg-indigo-700 transition-colors" onClick={() => handleSortTopics('sparxCode')}>
                          Sparx<br/>Codes {topicSortConfig.key === 'sparxCode' ? (topicSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 leading-tight text-center">Past Exam<br/>Qs</th>
                        <th className="p-4 leading-tight">Flash<br/>Cards</th>
                        <th className="p-4 leading-tight">Dates<br/>Covered</th>
                        <th className="p-4 rounded-tr-2xl cursor-pointer hover:bg-indigo-700 transition-colors leading-tight" onClick={() => handleSortTopics('studentConfidence')}>
                          My<br/>Confidence {topicSortConfig.key === 'studentConfidence' ? (topicSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                      </tr>
                    </thead>
                  <tbody>
                    {processedTopics.map((topic, index) => (
                      <tr key={topic._id} className={`border-b border-slate-200 hover:bg-slate-200 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-purple-100'}`}>
                        <td className="p-4 font-bold text-slate-600">{topic.areaName}</td>
                        <td className="p-4 font-black text-[#1B2559] whitespace-normal min-w-[160px] leading-snug">
                          {(() => {
                            const words = (topic.topicName || '').trim().split(/\s+/);
                            if (words.length >= 3) {
                              return (
                                <>
                                  {words.slice(0, 2).join(' ')}
                                  <br />
                                  {words.slice(2).join(' ')}
                                </>
                              );
                            }
                            return topic.topicName;
                          })()}
                        </td>
                        <td className="p-4">
                          {topic.grade && topic.grade !== 'N/A' ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-md font-black text-xs">
                              {topic.grade}
                            </span>
                          ) : (
                            <span className="font-bold text-slate-500">-</span>
                          )}
                        </td>
                        <td className="p-4 font-bold text-[#1B2559]">{topic.yearLevel || '-'}</td>
                        <td className="p-4 font-bold text-slate-500 text-sm">
                          {(() => {
                            if (!topic.sparxCode || topic.sparxCode === '-' || topic.sparxCode === 'N/A') return '-';
                            
                            // Determine if it's a comma-separated list or a space-separated sentence
                            const isList = topic.sparxCode.includes(',');
                            const separator = isList ? ',' : ' ';
                            const joiner = isList ? ', ' : ' ';
                            
                            const items = topic.sparxCode.split(separator).map(item => item.trim()).filter(Boolean);
                            
                            if (items.length <= 2) return topic.sparxCode;
                            
                            const rows = [];
                            for (let i = 0; i < items.length; i += 2) {
                              rows.push(items.slice(i, i + 2).join(joiner));
                            }
                            
                            return rows.map((r, i) => (
                              <React.Fragment key={i}>
                                {r}
                                {i < rows.length - 1 && <br />}
                              </React.Fragment>
                            ));
                          })()}
                        </td>
                        <td className="p-4">
                          {topic.pastPaperQues ? (
                            <a href={topic.pastPaperQues} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 underline font-bold text-xs">Click Here</a>
                          ) : <span className="text-slate-400 font-bold">-</span>}
                        </td>
                        <td className="p-4">
                          {topic.flashCards ? (
                            <a href={topic.flashCards} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 underline font-bold text-xs">Click Here</a>
                          ) : <span className="text-slate-400 font-bold">-</span>}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-[250px]">
                            {topic.datesCovered.filter(d => d.trim() !== '').map((date, i) => (
                              <span key={i} className="text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded">
                                {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            ))}
                            {topic.datesCovered.filter(d => d.trim() !== '').length === 0 && <span className="text-slate-400 font-bold">-</span>}
                          </div>
                        </td>
                        <td className="p-4">
                          <select 
                            value={topic.studentConfidence || ''} 
                            onChange={(e) => handleConfidenceChange(topic._id, e.target.value)}
                            className={`p-2 rounded-xl font-bold outline-none text-xs border-2 shadow-sm cursor-pointer transition-colors
                              ${!topic.studentConfidence ? 'bg-amber-50 border-amber-400 text-amber-800 ring-4 ring-amber-400/30 shadow-amber-400/20' :
                                topic.studentConfidence === 'Green' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                                topic.studentConfidence === 'Amber' ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                                topic.studentConfidence === 'Red' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-500'}`}
                          >
                            <option value="">Set Confidence...</option>
                            <option value="Green">🟢 Green</option>
                            <option value="Amber">🟡 Amber</option>
                            <option value="Red">🔴 Red</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {processedTopics.length === 0 && (
                      <tr>
                        <td colSpan="9" className="text-center py-10 text-slate-400 font-bold">No topics recorded for you yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}