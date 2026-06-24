import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';

export default function ParentDashboard() {
  const [childData, setChildData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState('progress');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    fetchChildData();
    fetchMessages();
  }, []);

  const fetchChildData = async () => {
    try {
      const res = await api.get('/parent/child-data');
      setChildData(res.data.childProfile);
      setAssignments(res.data.assignments);
    } catch (error) {
      console.error("Error fetching child data", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get('/messages'); // By default fetches conversation with Admin
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
    } catch (e) { console.error("Failed to send message"); }
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

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${childData.name.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1B2559] text-white flex flex-col p-6 shadow-xl rounded-r-3xl my-4 ml-4">
        <h1 className="text-2xl font-black mb-8 tracking-wide">Parent Portal</h1>
        <div className="space-y-4 flex-1">
          <button onClick={() => setActiveTab('progress')} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'progress' ? 'bg-violet-500 shadow-md' : 'text-slate-300 hover:bg-white/10'}`}>📊 Child Progress</button>
          <button onClick={() => setActiveTab('chat')} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'chat' ? 'bg-violet-500 shadow-md' : 'text-slate-300 hover:bg-white/10'}`}>👨‍🏫 Message Admin</button>
        </div>
        <button onClick={handleLogout} className="mt-auto px-4 py-3 bg-white/10 hover:bg-rose-500 text-white rounded-xl font-bold transition-all">Sign Out</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <h2 className="text-3xl font-black text-[#1B2559] mb-8">
          Monitoring: <span className="text-violet-600">{childData?.name || 'Loading...'}</span>
        </h2>

        {activeTab === 'progress' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-[#1B2559]">Recent Assignments & Grades</h3>
              <button onClick={downloadCSV} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-transform hover:-translate-y-1">
                📥 Download CSV Report
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                    <th className="p-4 rounded-tl-xl">Title</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 rounded-tr-xl">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(hw => (
                    <tr key={hw._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-[#1B2559]">{hw.title}</td>
                      <td className="p-4 text-sm font-medium text-slate-500">{new Date(hw.dueDate).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase
                          ${hw.status === 'Graded' ? 'bg-emerald-100 text-emerald-700' : hw.status === 'Submitted' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                          {hw.status}
                        </span>
                      </td>
                      <td className="p-4 font-black text-[#1B2559]">
                        {hw.grading?.score !== undefined ? `${hw.grading.score} / ${hw.grading.totalScore}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[600px] flex flex-col">
            <h3 className="text-xl font-black text-[#1B2559] mb-4 border-b pb-4">Direct Message: Admin/Teacher</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
              {messages.map(msg => {
                const isMe = typeof msg.sender === 'object' ? msg.sender.role === 'parent' : false; // basic check
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-4 rounded-2xl ${isMe ? 'bg-violet-500 text-white rounded-br-none' : 'bg-slate-100 text-[#1B2559] rounded-bl-none'}`}>
                      <p className="font-bold">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message to the admin..." className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-violet-500 font-medium" />
              <button type="submit" className="bg-[#1B2559] text-white px-8 font-black rounded-xl hover:bg-violet-600 transition-colors">Send</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}