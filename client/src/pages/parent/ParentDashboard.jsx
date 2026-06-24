import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function ParentDashboard() {
  const [childData, setChildData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchChildData();
    
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
      showToast("Error fetching child data", "error");
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

  const downloadCSV = () => {
    if (!childData || assignments.length === 0) return;
    
    const headers = ["Assignment Title", "Due Date", "Status", "Score", "Total Possible"];
    const rows = assignments.map(hw => [
      `"${hw.title}"`, 
      new Date(hw.dueDate).toLocaleDateString(), 
      hw.status, 
      hw.grading?.score !== undefined ? hw.grading.score : "N/A",
      hw.grading?.totalScore !== undefined ? hw.grading.totalScore : "N/A"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${childData.name.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0B1437] text-slate-300 flex flex-col shadow-2xl z-20 hidden lg:flex rounded-r-[2rem] my-4 ml-4 overflow-hidden">
        <div className="p-8 flex items-center gap-4 border-b border-slate-700/50 shrink-0">
          <div className="bg-gradient-to-tr from-violet-400 to-indigo-500 text-white w-12 h-12 flex items-center justify-center rounded-2xl font-black text-2xl shadow-lg shadow-violet-500/30">
            P
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-wide leading-tight">Parent<br/>Portal</h1>
          </div>
        </div>
        
        <div className="p-6 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Child's Progress
          </button>
          
          <button onClick={() => setActiveTab('messages')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'messages' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            Message Admin
          </button>
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
            
            <div className="flex gap-4 mt-6 md:mt-0">
              <button onClick={downloadCSV} className="bg-white hover:bg-violet-50 text-violet-600 px-6 py-4 rounded-3xl shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4 font-black transition-colors border border-transparent hover:border-violet-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Download CSV Report
              </button>
            </div>
          </div>

          {/* VIEW 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                <div className="bg-violet-500 w-2 h-8 rounded-full"></div>
                <h2 className="text-2xl font-black text-[#1B2559]">Recent Assignments & Grades</h2>
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
                    <h2 className="text-xl">Admin Support Chat</h2>
                    <p className="text-xs font-medium text-white/80">Message the mentor directly regarding {childData?.name}'s progress.</p>
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
                    <p>No messages yet. Send a message to the Admin!</p>
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

        </div>
      </div>
    </div>
  );
}