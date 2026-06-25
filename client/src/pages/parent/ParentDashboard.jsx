import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ParentDashboard() {
  const [childData, setChildData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [userId, setUserId] = useState(null);
  // Add these for the Settings Tab
  const [parentProfile, setParentProfile] = useState({ name: 'Parent', profilePic: '' });
  const [settingsForm, setSettingsForm] = useState({ name: '', profilePic: '' });

  useEffect(() => {
    fetchChildData();
    fetchProfile();
    
    // Extract User ID from token to properly align chat bubbles
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
      // FIX: Removed the extra '/api' so it correctly matches the backend route
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
      // FIX: Removed the extra '/api' here as well
      const res = await api.put('/auth/profile', settingsForm);
      
      const updatedData = res.data.user ? res.data.user : res.data;
      setParentProfile({ name: updatedData.name, profilePic: updatedData.profilePic || '' });
      showToast('Profile updated successfully!');
    } catch (err) {
      console.error("Update Error:", err.response || err); // Logs exact error in your browser console
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // FIX: Prevents massive images from crashing your server! 
      if (file.size > 2000000) {
        return showToast("Image is too large! Please choose a file under 2MB.", "error");
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsForm({ ...settingsForm, profilePic: reader.result }); // Saves as Base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  // 3. EXPORT LOGIC
  const handleExportCSV = () => {
    if (!assignments || assignments.length === 0) return showToast("No data to export", "error");

    const headers = ["Assignment Title", "Format/Type", "Due Date", "Status", "Score"];
    
    const rows = assignments.map(hw => {
      // Safely map the properties from your database
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
    
    // 🌟 FIX: Prioritize Registration Name for the downloaded file
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
      
      // 🌟 FIX: Prioritize Registration Name for the PDF Header and File Name
      const studentName = childData?.registrationName || childData?.name || "Student";
      
      doc.setFontSize(18);
      doc.setTextColor(27, 37, 89); // Matches your #1B2559 theme
      doc.text(`${studentName} - Performance Report`, 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      const tableColumn = ["Assignment Title", "Format/Type", "Due Date", "Status", "Score"];
      const tableRows = [];

      assignments.forEach(hw => {
        // 🌟 FIX: Map the title and type correctly for the rows
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
        headStyles: { fillColor: [139, 92, 246] }, // Violet color to match parent dashboard
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
    } catch (error) {
      // 🚨 FIX: This will now show the EXACT error message from the backend!
      // (e.g., "No linked student found." or "Child profile not found.")
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

  return (
    <div className="flex h-screen bg-[#F4F7FE] font-sans overflow-hidden text-slate-800 relative">
      
      {/* CUSTOM TOAST NOTIFICATION */}
      <div className={`absolute top-6 right-6 z-50 transform transition-all duration-500 ease-out flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-white
        ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${toast.type === 'error' ? 'bg-rose-500' : 'bg-slate-900'}`}>
        {toast.type === 'error' ? '⚠️' : '✅'}
        {toast.message}
      </div>

      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0B1437] text-slate-300 flex flex-col shadow-2xl z-20 hidden lg:flex rounded-r-[2rem] my-4 ml-4 overflow-hidden">
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
          {/* Top smooth fade */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#0B1437] to-transparent pointer-events-none z-10"></div>
          
          {/* Scrollable Area - HIDDEN SCROLLBAR */}
          <div className="p-6 space-y-3 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              Child's Progress
            </button>
            
            <button onClick={() => setActiveTab('messages')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'messages' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              Message Teacher
            </button>
            
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Settings
            </button>
          </div>

          {/* Bottom smooth fade with Pulsing Arrow indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0B1437] to-transparent pointer-events-none z-10 flex items-end justify-center pb-1">
            <svg className="w-5 h-5 text-slate-500/60 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
        
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
              <h1 className="text-4xl font-black text-[#1B2559]">Monitoring: {childData?.registrationName || childData?.name || 'Loading...'} 📊</h1>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-[#A3AED0] font-bold tracking-wide">Stay on top of your child's coursework and grades.</p>
                <div className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-xs font-black tracking-widest border border-violet-200 flex items-center gap-2">
                  ID: {childData?.studentId || 'N/A'}
                </div>
              </div>
            </div>

            {/* Child Analytics Cards */}
            <div className="flex gap-4 mt-6 md:mt-0">
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
                <h2 className="text-2xl font-black text-[#1B2559]">Recent Assignments & Grades</h2>
              </div>
              

              {/* STEP 5: EXPORT BUTTONS ADDED HERE */}
              <div className="flex gap-4 mb-6">
                <button onClick={handleExportCSV} className="px-6 py-3 bg-white border-2 border-[#1B2559] text-[#1B2559] hover:bg-[#1B2559] hover:text-white font-black rounded-xl transition-all flex items-center gap-2 shadow-sm">
                  📄 Export CSV
                </button>
                <button onClick={handleExportPDF} className="px-6 py-3 bg-white border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-black rounded-xl transition-all flex items-center gap-2 shadow-sm">
                  📑 Export PDF
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F4F7FE] text-[#A3AED0] text-xs font-black uppercase tracking-wider">
                      <th className="p-5 rounded-tl-2xl">Title</th>
                      <th className="p-5">Due Date</th>
                      <th className="p-5">Status</th>
                      <th className="p-5 rounded-tr-2xl">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map(hw => (
                      <tr key={hw._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-5 font-bold text-[#1B2559]">{hw.title}</td>
                        <td className="p-5 text-sm font-bold text-slate-500">{new Date(hw.dueDate).toLocaleDateString()}</td>
                        <td className="p-5">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm
                            ${hw.status === 'Graded' ? 'bg-emerald-100 text-emerald-700' : hw.status === 'Submitted' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                            {hw.status}
                          </span>
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
                      </tr>
                    ))}
                    {assignments.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-10 text-slate-400 font-bold">No assignments found for this student yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: MESSAGES */}
          {activeTab === 'messages' && (
            <div className="bg-white p-6 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] h-[700px] flex flex-col animate-fade-in relative overflow-hidden">
              
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
                  // NEW BULLETPROOF CHECK
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

              <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 shrink-0">
                <input type="text" className="flex-1 p-5 bg-[#F4F7FE] border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-violet-500/20 font-bold text-[#1B2559]" 
                  placeholder="Type your message..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                <button className="px-8 bg-[#1B2559] hover:bg-violet-600 text-white font-black rounded-2xl transition-all shadow-lg transform hover:-translate-y-1">Send</button>
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
                      {/* Hidden file input wrapped in a sleek hover overlay */}
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

        </div>
      </div>
    </div>
  );
}