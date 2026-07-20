import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useParams, useNavigate } from 'react-router-dom';

export default function ParentDashboard() {
  const [childData, setChildData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'dashboard';
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [userId, setUserId] = useState(null);
  // Add these for the Settings Tab
  const [parentProfile, setParentProfile] = useState({ name: 'Parent', profilePic: '' });
  const [settingsForm, setSettingsForm] = useState({ name: '', profilePic: '' });
  const [schemes, setSchemes] = useState([]);
  const [markedWorkPreview, setMarkedWorkPreview] = useState(null);
  const [driveLinks, setDriveLinks] = useState([]); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [plannerSessions, setPlannerSessions] = useState([]);
  const [plannerCurrentDate, setPlannerCurrentDate] = useState(new Date());
  const [topics, setTopics] = useState([]);

  // NEW FETCH FUNCTION FOR TOPICS
  const fetchTopics = async () => {
    try {
      const res = await api.get('/topics');
      setTopics(res.data);
    } catch (e) { console.error("Error fetching topics"); }
  };

  // 1. Move fetchSchemes outside useEffect
  const fetchSchemes = async (childId = null) => {
    try {
      const url = childId ? `/scheme?studentId=${childId}` : '/scheme';
      const res = await api.get(url);
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
    fetchChildData();
    fetchProfile();
    // fetchSchemes();
    fetchDriveLinks(); 
    fetchPlanner();
    fetchTopics();
    
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.id);
      } catch (e) {
        console.error("Invalid token");
      }
    }
  }, []);

  // 1. FETCH PROFILE
  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setParentProfile({ name: res.data.name, profilePic: res.data.profilePic || '' });
      setSettingsForm({ name: res.data.name, profilePic: res.data.profilePic || '' });
    } catch (error) {
      console.error("Failed to fetch profile");
    }
  };

  // 2. PROFILE SETTINGS LOGIC
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/auth/profile', settingsForm);
      
      const updatedData = res.data.user ? res.data.user : res.data;
      setParentProfile({ name: updatedData.name, profilePic: updatedData.profilePic || '' });
      showToast('Profile updated successfully!');
    } catch (err) {
      console.error("Update Error:", err.response || err);
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) {
        return showToast("Image is too large! Please choose a file under 2MB.", "error");
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsForm({ ...settingsForm, profilePic: reader.result }); 
      };
      reader.readAsDataURL(file);
    }
  };

  // 3. EXPORT LOGIC
  const handleExportCSV = () => {
    if (!assignments || assignments.length === 0) return showToast("No data to export", "error");

    const headers = ["Homework Title", "Format/Type", "Due Date", "Status", "Score"];
    
    const rows = assignments.map(hw => {
      const title = hw.title || "N/A";
      const type = hw.type || "File";
      const dueDate = new Date(hw.dueDate).toLocaleDateString();
      const status = hw.status || "Pending";
      
      let score = "N/A";
      if (hw.grading?.score != null && hw.grading?.totalScore) {
        score = `${hw.grading.score}/${hw.grading.totalScore}`;
      }

      return `"${title}","${type}","${dueDate}","${status}","${score}"`;
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    
    const studentName = childData?.registrationName || childData?.name || "Student";
    link.download = `${studentName}_Grades_${new Date().toISOString().split('T')[0]}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("CSV successfully exported!");
  };

  const handleExportPDF = async () => {
    if (!assignments || assignments.length === 0) return showToast("No data to export", "error");

    try {
      const doc = new jsPDF();
      
      const studentName = childData?.registrationName || childData?.name || "Student";
      
      doc.setFontSize(18);
      doc.setTextColor(27, 37, 89); 
      doc.text(`${studentName} - Performance Report`, 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      const tableColumn = ["Homework Title", "Format/Type", "Due Date", "Status", "Score"];
      const tableRows = [];

      assignments.forEach(hw => {
        const title = hw.title || "N/A";
        const type = hw.type || "File";
        const dueDate = new Date(hw.dueDate).toLocaleDateString();
        const status = hw.status || "Pending";
        
        let score = "-";
        if (hw.grading?.score != null && hw.grading?.totalScore) {
          score = `${hw.grading.score}/${hw.grading.totalScore}`;
        }

        tableRows.push([title, type, dueDate, status, score]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] },
      });

      doc.save(`${studentName}_Grades_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast("PDF successfully exported!");
    } catch (error) {
      console.error("PDF Export Error:", error);
      showToast("Error generating PDF.", "error");
    }
  };

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages();
    }
  }, [activeTab]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchChildData = async () => {
    try {
      const res = await api.get('/parent/child-data');
      setChildData(res.data.childProfile);
      setAssignments(res.data.assignments);
      
      if (res.data.childProfile && res.data.childProfile._id) {
        fetchSchemes(res.data.childProfile._id);
      } else {
        fetchSchemes();
      }
    } catch (error) {
      fetchSchemes(); 
      const errorMsg = error.response?.data?.message || "Server Error fetching data";
      console.error("Child Data Error:", errorMsg);
      showToast(errorMsg, "error");
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get('/messages'); 
      setMessages(res.data);
    } catch (e) { console.error("Error fetching messages"); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    try {
      await api.post('/messages', { content: chatInput }); 
      setChatInput('');
      fetchMessages(); 
    } catch (e) { showToast("Failed to send message", "error"); }
  }; 

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    window.location.href = '/'; 
  };

  // Calculate Child Analytics
  const gradedHw = assignments.filter(h => h.status === 'Graded');
  const pendingHw = assignments.filter(h => h.status === 'Pending');
  
  let totalEarned = 0; 
  let totalPossible = 0;
  
  gradedHw.forEach(h => {
    if(h.grading?.score != null && h.grading?.totalScore) {
        totalEarned += h.grading.score;
        totalPossible += h.grading.totalScore;
    }
  });
  
  const avgScore = totalPossible > 0 ? ((totalEarned / totalPossible) * 100).toFixed(1) : 0;

  const isLinkVisibleForChild = (link) => {
    if (!link.targetAudience || link.targetAudience === 'all') {
      if (link.yearGroupFilter && link.yearGroupFilter !== 'all') {
        return childData?.yearGroup === link.yearGroupFilter;
      }
      return true;
    }

    const audienceId = typeof link.targetAudience === 'object' && link.targetAudience !== null 
      ? String(link.targetAudience._id || link.targetAudience.id) 
      : String(link.targetAudience);
      
    const validIds = [
      childData?._id, childData?.id, childData?.student, childData?.child, 
      childData?.user, childData?.userId, childData?.studentId, userId
    ];
    
    if (assignments && assignments.length > 0) {
      const hwStudent = assignments[0].studentId;
      validIds.push(typeof hwStudent === 'object' && hwStudent !== null ? (hwStudent._id || hwStudent.id) : hwStudent);
    }

    const stringValidIds = validIds.filter(Boolean).map(String);
    if (stringValidIds.includes(audienceId)) return true;

    if (typeof link.targetAudience === 'object' && link.targetAudience !== null) {
      if (link.targetAudience.studentId && childData?.studentId && link.targetAudience.studentId === childData.studentId) return true;
      if (link.targetAudience.email && childData?.email && link.targetAudience.email === childData.email) return true;
    }

    return false;
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

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#0B1437]/60 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`w-72 bg-[#0B1437] text-slate-300 flex flex-col shadow-2xl z-50 fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 lg:flex rounded-r-[2rem] my-4 lg:ml-4 overflow-hidden`}>
        <div className="p-8 flex items-center gap-4 border-b border-slate-700/50 shrink-0">
          {parentProfile.profilePic ? (
            <img src={parentProfile.profilePic} alt="Profile" className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-violet-500/30" />
          ) : (
            <div className="bg-gradient-to-tr from-violet-400 to-indigo-500 text-white w-12 h-12 flex items-center justify-center rounded-2xl font-black text-2xl shadow-lg shadow-violet-500/30">
              {parentProfile.name ? parentProfile.name.charAt(0).toUpperCase() : 'P'}
            </div>
          )}
          <div>
            <h1 className="text-lg font-black tracking-wide leading-tight">
              <span className="text-white">MathCom Mentors</span><br/>
            </h1>
          </div>
        </div>
        
        {/* Navigation Links with Gradient Scroll Indicator */}
        <div className="relative flex-1 flex flex-col overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#0B1437] to-transparent pointer-events-none z-10"></div>
          
          <div className="p-6 space-y-3 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button onClick={() => { navigate('/parent-dashboard/dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              Child's Progress
            </button>

            <button onClick={() => { navigate('/parent-dashboard/drive'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'drive' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
              Shared Drive
            </button>

            <button onClick={() => { navigate('/parent-dashboard/scheme'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'scheme' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Lesson Schedule
            </button>

            <button onClick={() => { navigate('/parent-dashboard/topics'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'topics' ? 'bg-violet-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              Topics Covered
            </button>

            <button onClick={() => { navigate('/parent-dashboard/calendar'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'calendar' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Class Calendar
            </button>
            
            <button onClick={() => { navigate('/parent-dashboard/messages'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'messages' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              Message Teacher
            </button>
            
            <button onClick={() => { navigate('/parent-dashboard/settings'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
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
              <div className="bg-violet-500 w-10 h-10 flex items-center justify-center rounded-xl text-white font-bold text-xl">P</div>
              <h1 className="font-black text-[#1B2559] text-xl">Portal</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-100 rounded-lg text-[#1B2559] hover:bg-slate-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
          </div>
          
          {/* Header */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6">
  <div>
    <h1 className="text-4xl font-black text-[#1B2559]">Monitoring: {childData?.registrationName || childData?.name || 'Loading...'} 📊</h1>
    <div className="flex items-center gap-3 mt-2">
                <p className="text-[#A3AED0] font-bold tracking-wide">Stay on top of your child's coursework and grades.</p>
                <div className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-xs font-black tracking-widest border border-violet-200 flex items-center gap-2">
                  ID: {childData?.studentId || 'N/A'}
                </div>
              </div>
            </div>

            {/* Child Analytics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full xl:w-auto shrink-0">
              <div className="bg-white px-6 py-4 rounded-3xl shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4 border border-slate-100">
                <div className="bg-amber-50 p-3 rounded-full text-amber-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <p className="text-xs font-black text-[#A3AED0] uppercase tracking-wider">To Do</p>
                  <p className="text-2xl font-black text-[#1B2559]">{pendingHw.length}</p>
                </div>
              </div>
              
              <div className="bg-white px-6 py-4 rounded-3xl shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4 border border-slate-100">
                <div className="bg-emerald-50 p-3 rounded-full text-emerald-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div>
                  <p className="text-xs font-black text-[#A3AED0] uppercase tracking-wider">Graded</p>
                  <p className="text-2xl font-black text-[#1B2559]">{gradedHw.length}</p>
                </div>
              </div>
              
              <div className="bg-white px-6 py-4 rounded-3xl shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4 border border-slate-100">
                <div className="bg-violet-50 p-3 rounded-full text-violet-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                </div>
                <div>
                  <p className="text-xs font-black text-[#A3AED0] uppercase tracking-wider">Avg Score</p>
                  <p className="text-2xl font-black text-[#1B2559]">{avgScore}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* VIEW 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                <div className="bg-violet-500 w-2 h-8 rounded-full"></div>
                <h2 className="text-2xl font-black text-[#1B2559]">Recent Homework & Grades</h2>
              </div>
              

              {/* STEP 5: EXPORT BUTTONS ADDED HERE */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full">
  <button onClick={handleExportCSV} className="w-full sm:w-auto justify-center px-6 py-4 bg-white border-2 border-[#1B2559] text-[#1B2559] hover:bg-[#1B2559] hover:text-white font-black rounded-xl transition-all flex items-center gap-2 shadow-sm">
    📄 Export CSV
  </button>
  <button onClick={handleExportPDF} className="w-full sm:w-auto justify-center px-6 py-4 bg-white border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-black rounded-xl transition-all flex items-center gap-2 shadow-sm">
    📑 Export PDF
  </button>
</div>
              
              <div className="overflow-x-auto w-full max-w-full pb-4 relative"> 
  <table className="w-full min-w-[800px] text-left border-collapse whitespace-nowrap">
     <thead>
        <tr className="bg-[#F4F7FE] text-[#A3AED0] text-xs font-black uppercase tracking-wider">
          <th className="p-5 rounded-tl-2xl"> Homework Title</th>
          <th className="p-5">Due Date</th>
          <th className="p-5">Status</th>
          <th className="p-5">Score</th>
          <th className="p-5">Marked Work</th>
          <th className="p-5 rounded-tr-2xl">Drive Link</th>
        </tr>
      </thead>
                  <tbody>
                    {assignments.map(hw => (
                      <tr key={hw._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-5 font-bold text-[#1B2559]">{hw.title}</td>
                        <td className="p-5 text-sm font-bold text-slate-500">{new Date(hw.dueDate).toLocaleDateString()}</td>
                        <td className="p-5">
  {(() => {
    let displayStatus = hw.status;
    let statusColor = 'bg-slate-100 text-slate-500'; 
    
    const now = new Date();
    const dueDate = new Date(hw.dueDate);
    const submittedAt = hw.submission?.submittedAt ? new Date(hw.submission.submittedAt) : null;

    if (hw.status === 'Graded') {
      statusColor = 'bg-emerald-100 text-emerald-700';
    } else if (hw.status === 'Submitted') {
      statusColor = 'bg-amber-100 text-amber-700';
      
      // Logic for late submission
      if (submittedAt && submittedAt > dueDate) {
        const diffMs = submittedAt - dueDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) displayStatus = `Completed (${diffDays} day${diffDays > 1 ? 's' : ''} late)`;
        else if (diffHours > 0) displayStatus = `Completed (${diffHours} hour${diffHours > 1 ? 's' : ''} late)`;
        else displayStatus = `Completed (${diffMins} min${diffMins > 1 ? 's' : ''} late)`;
        
        statusColor = 'bg-rose-100 text-rose-700';
      }
    } else {
  if (now > dueDate) {
    const diffMs = now - dueDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    let lateText = '';
    if (diffDays > 0) lateText = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    else if (diffHours > 0) lateText = `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    else lateText = `${diffMins} min${diffMins > 1 ? 's' : ''}`;

    displayStatus = `Overdue (${lateText} late)`;
    statusColor = 'bg-rose-100 text-rose-700';
  }
}

    return (
      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${statusColor}`}>
        {displayStatus}
      </span>
    );
  })()}
</td>
                        <td className="p-5">
                          {hw.grading?.score !== undefined ? (
                            <span className="bg-[#1B2559] text-white px-3 py-1.5 rounded-lg font-black text-sm shadow-md">
                              {hw.grading.score} / {hw.grading.totalScore}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">-</span>
                          )}
                        </td>
                        <td className="p-5">
                          {hw.grading?.adminAnswerSheetUrl ? (
                            <button onClick={() => setMarkedWorkPreview(hw)} className="text-xs bg-violet-100 text-violet-700 px-3 py-1.5 rounded-lg font-black hover:bg-violet-600 hover:text-white transition-colors flex items-center gap-1 w-fit shadow-sm cursor-pointer border-none">
                              📎 View Work
                            </button>
                          ) : (
                            <span className="text-xs font-black bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg">No marked work attached</span>
                          )}
                        </td>
                        <td className="p-5">
                          {hw.driveLink ? (
                            <a href={hw.driveLink} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-black hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-1 w-fit shadow-sm">
                              ☁️ Open Drive
                            </a>
                          ) : (
                            <span className="text-xs font-black text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {assignments.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-10 text-slate-400 font-bold">No homework found for this student yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: MESSAGES */}
          {activeTab === 'messages' && (
            <div className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] h-[85vh] md:h-[700px] flex flex-col animate-fade-in relative overflow-hidden">
              
              <div className="bg-violet-500 shadow-violet-500/20 text-white p-6 rounded-2xl mb-4 font-black flex items-center justify-between shadow-lg transition-colors shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">👨‍🏫</div>
                  <div>
                    <h2 className="text-xl">Mentor Support Chat</h2>
                    <p className="text-xs font-medium text-white/80">Message the mentor directly regarding {childData?.registrationName || childData?.name}'s progress.</p>
                  </div>
                </div>
                <div className="bg-white/20 px-3 py-1.5 rounded-full border border-white/30 text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-sm shadow-sm">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                   Chats delete after 24 hours
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#F4F7FE]/50 rounded-2xl border border-slate-100">
                {messages.map(msg => {
                  const isMe = typeof msg.sender === 'object' ? msg.sender._id === userId : msg.sender === userId;

                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${isMe ? 'bg-violet-500 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}`}>
                        <p className="font-bold">{msg.content}</p>
                        <span className={`text-[10px] block mt-1 ${isMe ? 'text-violet-200' : 'text-slate-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <div className="text-center text-slate-400 font-bold mt-20">
                    <p className="text-4xl mb-2">👋</p>
                    <p>No messages yet. Send a message to the Mentor!</p>
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

          {/* VIEW 3: SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="animate-fade-in max-w-2xl mx-auto">
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                  <div className="bg-violet-500 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#1B2559]">Profile Settings</h2>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      {settingsForm.profilePic ? (
                        <img src={settingsForm.profilePic} alt="Profile" className="w-24 h-24 rounded-3xl object-cover shadow-md" />
                      ) : (
                        <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center text-4xl shadow-md">👤</div>
                      )}
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-3xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
                        <span className="text-xs font-bold">Upload</span>
                      </label>
                    </div>
                    <div>
                      <h3 className="font-black text-[#1B2559] text-lg">Profile Picture</h3>
                      <p className="text-sm font-bold text-[#A3AED0]">JPG, PNG under 2MB</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Display Name</label>
                    <input type="text" className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/20 font-bold text-[#1B2559]" 
                      value={settingsForm.name || ''} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} required />
                  </div>

                  <button type="submit" className="w-full py-4 bg-violet-500 hover:bg-violet-600 text-white font-black rounded-2xl shadow-lg transition-transform hover:-translate-y-1">
                    Save Profile Update
                  </button>
                </form>
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
                      <th className="p-5 rounded-tl-2xl">Date & Week</th>
                      <th className="p-5">Lesson Title</th>
                      <th className="p-5">Status</th>
                      <th className="p-5">Time & Duration</th>
                      <th className="p-5 rounded-tr-2xl">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemes.map(report => (
                      <tr key={report._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-5">
                          <p className="font-bold text-[#1B2559]">
                            {new Date(report.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-xs font-bold text-[#A3AED0] mt-1">Week {report.weekNo || 'N/A'}</p>
                        </td>
                        <td className="p-5">
                          <p className="font-bold text-[#1B2559]">{report.title}</p>
                          {report.topic && <p className="text-xs font-bold text-slate-500 mt-1">Topic: {report.topic}</p>}
                        </td>
                        <td className="p-5">
                          <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider shadow-sm ${report.classStatus === 'Class Taken' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {report.classStatus === 'Class Taken' ? '✅ Class Taken' : `❌ ${report.classStatus}`}
                          </span>
                        </td>
                        <td className="p-5">
                          {report.classStatus === 'Class Taken' && report.startTime && report.endTime ? (
                            <div>
                              <p className="text-sm font-bold text-violet-700 bg-violet-50 px-2 py-1 rounded-md inline-block mb-1 border border-violet-100">
                                {report.startTime} - {report.endTime}
                              </p>
                              <p className="text-xs font-bold text-slate-500 block">
                                Duration: {
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
                          <p className="text-sm text-slate-600 font-medium line-clamp-2" title={report.description}>
                            {report.description || '-'}
                          </p>
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
          {/* PARENT VIEW: CLASS CALENDAR */}
          {activeTab === 'calendar' && (() => {
            const year = plannerCurrentDate.getFullYear();
            const month = plannerCurrentDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            const getSessionsForDay = (day) => {
              return plannerSessions.filter(session => {
                let isVisible = false;
                if (!session.studentId || session.studentId === 'all') {
                    if (session.yearGroupFilter && session.yearGroupFilter !== 'all') {
                        isVisible = childData?.yearGroup === session.yearGroupFilter;
                    } else {
                        isVisible = true;
                    }
                } else {
                    isVisible = session.studentId === childData?._id;
                }

                if (!isVisible) return false;

                const d = new Date(session.startDate);
                return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
              });
            };

            return (
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-slate-100 pb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-violet-500 w-2 h-8 rounded-full"></div>
                    <h2 className="text-2xl font-black text-[#1B2559]">Class Calendar</h2>
                  </div>
                  <div className="flex items-center gap-4 bg-[#F4F7FE] p-2 rounded-2xl">
                    <button onClick={() => setPlannerCurrentDate(new Date(year, month - 1, 1))} className="p-3 bg-white rounded-xl shadow-sm hover:bg-slate-100">
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <h3 className="text-xl font-black text-[#1B2559] min-w-[160px] text-center">{monthNames[month]} {year}</h3>
                    <button onClick={() => setPlannerCurrentDate(new Date(year, month + 1, 1))} className="p-3 bg-white rounded-xl shadow-sm hover:bg-slate-100">
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
                    const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

                    return (
                      <div key={day} className={`min-h-[100px] md:min-h-[120px] p-2 md:p-3 rounded-2xl border bg-white ${isToday ? 'border-violet-300 bg-violet-50/30' : 'border-slate-100'}`}>
                        <div className={`text-xs md:text-sm font-black w-7 h-7 flex items-center justify-center rounded-full mb-2 ${isToday ? 'bg-violet-500 text-white' : 'text-[#1B2559]'}`}>{day}</div>
                        <div className="space-y-1.5 overflow-y-auto max-h-[70px] custom-scrollbar pr-1">
                          {getSessionsForDay(day).map(session => (
                            <div key={session._id} 
                              className="text-[9px] md:text-[10px] font-bold p-1.5 md:p-2 rounded-lg bg-indigo-100 text-indigo-700 shadow-sm border border-indigo-200 flex items-center gap-1 overflow-hidden" 
                              title={session.topic}>
                              <span className="shrink-0">🎥 {new Date(session.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              <span className="truncate">- {session.topic}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          
          {markedWorkPreview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-6">
              <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col relative border-4 border-violet-500">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                  <h3 className="font-black text-slate-800 text-lg">Checked/Marked Work Preview</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const studentName = childData?.registrationName || childData?.name || 'Unknown';
                        const yearGroup = childData?.yearGroup || 'Y?';
                        
                        const initials = studentName.split(' ')[0];
                        
                        let formattedTitle = (markedWorkPreview.title || '').toUpperCase()
                            .replace(' HW ', ' MW ')
                            .replace(' TEST ', ' MW ');

                        let ext = '.pdf';
                        if (markedWorkPreview.grading.adminAnswerSheetUrl) {
                            if (markedWorkPreview.grading.adminAnswerSheetUrl.includes('image/jpeg') || markedWorkPreview.grading.adminAnswerSheetUrl.includes('image/jpg')) ext = '.jpg';
                            else if (markedWorkPreview.grading.adminAnswerSheetUrl.includes('image/png')) ext = '.png';
                        }
                        const fileName = `${initials} - ${yearGroup} - ${formattedTitle}${ext}`;

                        const a = document.createElement('a');
                        a.href = markedWorkPreview.grading.adminAnswerSheetUrl;
                        a.download = fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }} 
                      className="bg-violet-100 text-violet-700 hover:bg-violet-600 hover:text-white px-4 py-2 rounded-xl font-black transition-all cursor-pointer border-none flex items-center gap-2"
                    >
                      ⬇️ Download PDF
                    </button>
                    <button onClick={() => setMarkedWorkPreview(null)} className="bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white px-4 py-2 rounded-xl font-black transition-all cursor-pointer border-none">
                      ✕ Close
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto bg-slate-50 rounded-2xl p-2 flex justify-center items-center min-h-[400px]">
                   {markedWorkPreview.grading.adminAnswerSheetUrl.endsWith('.pdf') || markedWorkPreview.grading.adminAnswerSheetUrl.includes('pdf') || markedWorkPreview.grading.adminAnswerSheetUrl.startsWith('data:application/pdf') ? (
  <iframe src={markedWorkPreview.grading.adminAnswerSheetUrl} className="w-full h-[500px] border-0 rounded-xl" title="Marked PDF"></iframe>
) : markedWorkPreview.grading.adminAnswerSheetUrl.startsWith('http') || markedWorkPreview.grading.adminAnswerSheetUrl.includes('image') || markedWorkPreview.grading.adminAnswerSheetUrl.startsWith('data:image') ? (
  <img src={markedWorkPreview.grading.adminAnswerSheetUrl} alt="Marked Work" className="max-h-[500px] max-w-full object-contain rounded-xl shadow-sm" />
) : (
  <div className="text-center p-8">
    <p className="font-black text-slate-700 mb-2">Unsupported File Format</p>
    <a href={markedWorkPreview.grading.adminAnswerSheetUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-indigo-500 text-white px-4 py-2 rounded-xl font-black shadow-md inline-block">Open File in New Tab</a>
  </div>
)}
                </div>
              </div>
            </div>
          )}         
          
          {/* PARENT VIEW: SHARED DRIVE */}
          {activeTab === 'drive' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                <div className="bg-blue-500 w-2 h-8 rounded-full"></div>
                <h2 className="text-2xl font-black text-[#1B2559]">Shared Drive Links ☁️</h2>
              </div>
              <p className="text-slate-500 font-bold mb-8">Access files and external drive folders provided for {childData?.registrationName || childData?.name}.</p>
                
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {driveLinks.filter(isLinkVisibleForChild).map(link => (
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
                      className="mt-6 w-full py-3.5 bg-[#F4F7FE] text-[#1B2559] hover:bg-violet-500 hover:text-white font-black rounded-xl transition-all shadow-sm flex justify-center items-center gap-2 transform group-hover:-translate-y-1">
                      🔗 Open Folder
                    </button>
                  </div>
                ))}
                
                {driveLinks.filter(isLinkVisibleForChild).length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-6xl mb-4 opacity-50">☁️</div>
                    <h3 className="text-[#1B2559] font-black text-2xl mb-1">No Links Shared</h3>
                    <p className="text-[#A3AED0] font-bold">No external drive links have been assigned yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* PARENT VIEW: TOPICS COVERED TAB */}
          {activeTab === 'topics' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                <div className="bg-violet-500 w-2 h-8 rounded-full"></div>
                <h2 className="text-2xl font-black text-[#1B2559]">Topics Covered 📚</h2>
              </div>
              <p className="text-slate-500 font-bold mb-8">Review the curriculum areas and topics your child has completed.</p>
              
              <div className="overflow-x-auto w-full max-w-full pb-4 relative max-h-[600px] custom-scrollbar">
                <table className="w-full min-w-[800px] text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#F4F7FE] text-[#A3AED0] text-xs font-black uppercase tracking-wider sticky top-0 z-10">
                      <th className="p-4 rounded-tl-2xl">Area</th>
                      <th className="p-4">Topic Name</th>
                      <th className="p-4">Grade</th>
                      <th className="p-4">Year Level</th>
                      <th className="p-4">Dates Covered</th>
                      <th className="p-4 rounded-tr-2xl">Student Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topics.filter(topic => {
                      if (!topic.studentId || topic.studentId === 'all') return true;
                      const assignedId = typeof topic.studentId === 'object' ? topic.studentId._id : topic.studentId;
                      return assignedId === childData?._id;
                    }).map(topic => (
                      <tr key={topic._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-600">{topic.areaName}</td>
                        <td className="p-4 font-black text-[#1B2559]">{topic.topicName}</td>
                        <td className="p-4">
                          <span className="bg-violet-50 text-violet-700 border border-violet-200 px-2 py-1 rounded-md font-black text-xs">
                            {topic.grade}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-[#1B2559]">{topic.yearLevel || '-'}</td>
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
                            {topic.studentConfidence ? (
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm
                                ${topic.studentConfidence === 'Green' ? 'bg-emerald-100 text-emerald-700' : 
                                  topic.studentConfidence === 'Amber' ? 'bg-amber-100 text-amber-700' : 
                                  'bg-rose-100 text-rose-700'}`}>
                                {topic.studentConfidence === 'Green' ? '🟢 Green' : topic.studentConfidence === 'Amber' ? '🟡 Amber' : '🔴 Red'}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-bold text-xs">-</span>
                            )}
                        </td>
                      </tr>
                    ))}
                    {topics.filter(topic => {
                      if (!topic.studentId || topic.studentId === 'all') return true;
                      const assignedId = typeof topic.studentId === 'object' ? topic.studentId._id : topic.studentId;
                      return assignedId === childData?._id;
                    }).length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-10 text-slate-400 font-bold">No topics recorded for your child yet.</td>
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