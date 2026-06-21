import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminDashboard() {
  // Navigation & Data State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [homeworks, setHomeworks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [minDateTime, setMinDateTime] = useState('');

  // Form State
  const [assignForm, setAssignForm] = useState({
    title: '', type: 'File', studentId: 'all', difficulty: 'Medium', 
    dueDate: '', fileUrl: '', content: '', 
    mcqs: [{ question: '', options: ['', '', '', ''], correctOption: 0 }]
  });
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // 🌟 NEW ADDITION: State for optional answer sheet upload
  const [answerSheet, setAnswerSheet] = useState({ fileUrl: '', fileName: '', isUploading: false });

  // 🌟 NEW: Custom UI States (Toasts & Modals)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [modal, setModal] = useState({ type: null, hwId: null, studentId: null, data: '' }); 

  // 🌟 NEW: Admin Profile & Settings State
  const [adminProfile, setAdminProfile] = useState({ name: 'Mentor', profilePic: '' });
  const [settingsForm, setSettingsForm] = useState({ name: '', profilePic: '', studentToDelete: '' });
  const [isProfileUploading, setIsProfileUploading] = useState(false);

  useEffect(() => {
    // 🌟 Extract Profile from token/localStorage
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const savedPic = localStorage.getItem('adminProfilePic') || '';
        const savedName = localStorage.getItem('adminName') || payload.name || 'Mentor';
        setAdminProfile({ name: savedName, profilePic: savedPic });
        setSettingsForm(prev => ({ ...prev, name: savedName, profilePic: savedPic }));
      } catch (e) {
        console.error("Could not parse token");
      }
    }
    fetchData();

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setMinDateTime(now.toISOString().slice(0, 16));
  }, []);

  const fetchData = async () => {
    try {
      const [studentRes, hwRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/homework/admin')
      ]);
      setStudents(studentRes.data);
      setHomeworks(hwRes.data);
    } catch (error) {
      showToast("Error fetching dashboard data.", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    window.location.href = '/'; 
  };

  // 🌟 Custom Notification System
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
        setAssignForm({ ...assignForm, fileUrl: reader.result });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // 🌟 NEW ADDITION: Handler for answer sheet upload
  const handleAnswerSheetUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) return showToast("File is too large! Please keep it under 5MB.", "error");
      setAnswerSheet({ ...answerSheet, fileName: file.name, isUploading: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnswerSheet({ ...answerSheet, fileUrl: reader.result, fileName: file.name, isUploading: false });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.dueDate) return showToast("Please assign a valid Due Date!", "error");

    try {
      await api.post('/homework/assign', assignForm);
      showToast('🎉 Assignment successfully published!');
      fetchData(); 
      setAssignForm({ ...assignForm, title: '', fileUrl: '', content: '', mcqs: [{ question: '', options: ['', '', '', ''], correctOption: 0 }] });
      setFileName('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error assigning work.', "error");
    }
  };

  const addMcq = () => setAssignForm({ ...assignForm, mcqs: [...assignForm.mcqs, { question: '', options: ['', '', '', ''], correctOption: 0 }] });
  const updateMcq = (index, field, value, optionIndex = null) => {
    const updatedMcqs = [...assignForm.mcqs];
    if (field === 'options') updatedMcqs[index].options[optionIndex] = value;
    else updatedMcqs[index][field] = value;
    setAssignForm({ ...assignForm, mcqs: updatedMcqs });
  };

  // 🌟 Modal Actions Executions
  const executeModalAction = async () => {
    try {
      if (modal.type === 'grade') {
        // 🌟 Allow submission if score is empty BUT an answer sheet is provided
        if ((modal.data !== '' && (modal.data < 0 || modal.data > 100)) || (!modal.data && !answerSheet.fileUrl)) {
          return showToast("Enter a valid score (0-100) or attach an answer sheet!", "error");
        }
        
        await api.put(`/homework/${modal.hwId}/grade`, { 
          score: modal.data !== '' ? Number(modal.data) : null, 
          adminAnswerSheetUrl: answerSheet.fileUrl 
        });
        
        showToast("Assignment Graded Successfully!");
      }
      else if (modal.type === 'extend') {
        if (!modal.data) return showToast("Select a valid date!", "error");
        await api.put(`/homework/${modal.hwId}/extend`, { newDueDate: modal.data });
        showToast("Deadline Extended!");
      } 
      else if (modal.type === 'delete') {
        await api.delete(`/homework/${modal.hwId}`);
        showToast("Assignment Deleted.", "error"); 
      }
      else if (modal.type === 'deleteStudent') {
        await api.delete(`/admin/students/${modal.studentId}`);
        showToast("Student Removed Successfully.", "error");
      }
      else if (modal.type === 'deleteAnsSheet') {
        // 🌟 NEW: Deletes the answer sheet from a graded assignment by overwriting it
        await api.put(`/homework/${modal.hwId}/grade`, { score: modal.data.score, adminAnswerSheetUrl: '' });
        showToast("Answer Sheet Removed!");
      }
      
      setModal({ type: null, hwId: null, studentId: null, data: '' });
      setAnswerSheet({ fileUrl: '', fileName: '', isUploading: false }); 
      fetchData();
    } catch (error) {
      showToast(error.response?.data?.message || "Action failed.", "error");
    }
  };

  const filteredHomeworks = homeworks.filter(hw => 
    hw.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    hw.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 🌟 Handle Profile Picture Upload
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

  // 🌟 Save Profile Settings to LocalStorage
  const handleSaveSettings = () => {
    setAdminProfile({ name: settingsForm.name, profilePic: settingsForm.profilePic });
    localStorage.setItem('adminName', settingsForm.name);
    if (settingsForm.profilePic) localStorage.setItem('adminProfilePic', settingsForm.profilePic);
    showToast("Profile Settings Updated Successfully!");
  };

  return (
    <div className="flex h-screen bg-[#F4F7FE] font-sans overflow-hidden text-slate-800 relative">
      
      {/* 🌟 CUSTOM TOAST NOTIFICATION */}
      <div className={`absolute top-6 right-6 z-50 transform transition-all duration-500 ease-out flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-white
        ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${toast.type === 'error' ? 'bg-rose-500' : 'bg-slate-900'}`}>
        {toast.type === 'error' ? '⚠️' : '✅'}
        {toast.message}
      </div>

      {/* 🌟 CUSTOM MODAL OVERLAY */}
      {modal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl transform scale-100 animate-slide-up">
            
            {modal.type === 'grade' && (
              <>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Grade Assignment</h3>
                <p className="text-slate-500 text-sm mb-6">Enter a score out of 100 (Optional if attaching file).</p>
                <input type="number" min="0" max="100" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-black text-2xl text-center mb-6" 
                  value={modal.data} onChange={e => setModal({...modal, data: e.target.value})} placeholder="0 - 100 (Optional)" />
                  
                {/* 🌟 NEW ADDITION: Optional Answer Sheet Form */}
                <p className="text-slate-500 text-sm mb-2 font-bold">Attach Answer Sheet (Optional)</p>
                <div className="relative border-2 border-dashed border-slate-300 bg-slate-50 rounded-2xl p-4 text-center hover:bg-slate-100 transition-colors cursor-pointer mb-6 group">
                  <input type="file" accept=".pdf, image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleAnswerSheetUpload} />
                  <p className="font-bold text-slate-600 text-sm">{answerSheet.fileName ? `📎 ${answerSheet.fileName}` : 'Click to upload PDF/Image'}</p>
                  {answerSheet.isUploading && <p className="text-xs text-amber-500 mt-1">Uploading...</p>}
                </div>
              </>
            )}

            {modal.type === 'extend' && (
              <>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Extend Deadline 📅</h3>
                <p className="text-slate-500 text-sm mb-6">Select the new due date and time for this assignment.</p>
                <input type="datetime-local" min={minDateTime} className="w-full p-4 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold mb-6" 
                  value={modal.data} onChange={e => setModal({...modal, data: e.target.value})} />
              </>
            )}

            {(modal.type === 'delete' || modal.type === 'deleteStudent' || modal.type === 'deleteAnsSheet') && (
              <>
                <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-4 text-3xl mx-auto">🗑️</div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 text-center">
                  {modal.type === 'deleteStudent' ? 'Remove Student?' : modal.type === 'deleteAnsSheet' ? 'Delete Answer Sheet?' : 'Delete Assignment?'}
                </h3>
                <p className="text-slate-500 text-sm mb-6 text-center">
                  {modal.type === 'deleteAnsSheet' ? 'This will remove your uploaded answer sheet from this graded assignment.' : 'This action is permanent and cannot be undone.'}
                </p>
              </>
            )}

            {/* 🌟 NEW: View Work Inline Preview Modal */}
            {modal.type === 'viewWork' && (
              <>
                <h3 className="text-2xl font-black text-[#1B2559] mb-4 text-left border-b border-slate-100 pb-4">Student's Submission</h3>

                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 mb-6 text-left space-y-4">
                  {modal.data.answerText && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <h4 className="text-xs font-black text-[#A3AED0] uppercase tracking-wide mb-2">Written Answer</h4>
                      <p className="text-slate-700 whitespace-pre-wrap font-medium">{modal.data.answerText}</p>
                    </div>
                  )}

                  {modal.data.answerFileUrl && (
                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs font-black text-[#A3AED0] uppercase tracking-wide mt-2">Attached File Preview</h4>
                      
                      <div className="w-full max-h-[400px] overflow-auto border-2 border-slate-200 rounded-2xl bg-[#F4F7FE] p-2 shadow-inner">
                        {modal.data.answerFileUrl.startsWith('data:image') ? (
                          <img src={modal.data.answerFileUrl} alt="Submission" className="w-full h-auto rounded-xl object-contain" />
                        ) : modal.data.answerFileUrl.startsWith('data:application/pdf') ? (
                          <embed src={modal.data.answerFileUrl} type="application/pdf" className="w-full h-[380px] rounded-xl" />
                        ) : (
                          <p className="text-center text-slate-500 py-10 font-bold">Preview not available for this format.</p>
                        )}
                      </div>

                      <button type="button" onClick={() => {
                          const a = document.createElement('a');
                          a.href = modal.data.answerFileUrl;
                          a.download = `${(modal.title || 'Student_Submission').replace(/\s+/g, '_')}_Attachment`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }}
                        className="w-full mt-2 px-6 py-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 font-black rounded-2xl transition-all border-2 border-dashed border-indigo-200 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Download Full File
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 🌟 Dynamic Footer layout based on modal type */}
            <div className="flex gap-4">
              {modal.type === 'viewWork' ? (
                <button onClick={() => setModal({ type: null, hwId: null, studentId: null, data: '' })} className="w-full py-4 bg-slate-100 text-slate-700 hover:bg-slate-200 font-black rounded-2xl transition-colors">
                  Close Preview
                </button>
              ) : (
                <>
                  <button onClick={() => { setModal({ type: null, hwId: null, studentId: null, data: '' }); setAnswerSheet({ fileUrl: '', fileName: '', isUploading: false }); }} className="flex-1 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold rounded-2xl transition-colors">
                    Cancel
                  </button>
                  <button onClick={executeModalAction} className={`flex-1 py-4 font-bold rounded-2xl text-white transition-transform hover:-translate-y-1 shadow-lg
                    ${(modal.type === 'delete' || modal.type === 'deleteStudent' || modal.type === 'deleteAnsSheet') ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30' : 
                      modal.type === 'grade' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 
                      'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'}`}>
                    {(modal.type === 'delete' || modal.type === 'deleteStudent' || modal.type === 'deleteAnsSheet') ? 'Yes, Delete' : 'Confirm'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🟢 SLEEK SIDEBAR */}
      <aside className="w-72 bg-[#0B1437] text-slate-300 flex flex-col justify-between shadow-2xl z-20 hidden lg:flex rounded-r-[2rem] my-4 ml-4">
        <div>
          <div className="p-8 flex items-center gap-4 border-b border-slate-700/50">
            {adminProfile.profilePic ? (
              <img src={adminProfile.profilePic} alt="Profile" className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-indigo-500/30" />
            ) : (
              <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 text-white w-12 h-12 flex items-center justify-center rounded-2xl font-black text-2xl shadow-lg shadow-indigo-500/30">
                M
              </div>
            )}
            <div>
              {/* 🌟 Reverted back to the hardcoded app name */}
              <h1 className="text-lg font-black text-white tracking-wide leading-tight">MathCom<br/>Mentor</h1>
            </div>
          </div>
          
          <div className="p-6 space-y-3">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all
              ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              Assignments Hub
            </button>
            <button onClick={() => setActiveTab('students')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all
              ${activeTab === 'students' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              Student List
            </button>
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all
              ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Settings
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <button onClick={handleLogout} className="w-full flex justify-center items-center gap-2 bg-slate-800 hover:bg-rose-500 text-slate-300 hover:text-white px-5 py-4 rounded-2xl font-bold transition-all shadow-sm group">
            <svg className="w-5 h-5 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* 🟢 MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto scroll-smooth p-6 lg:p-10">
        <div className="max-w-[1600px] mx-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
            <div>
              {/* 🌟 dynamically injects your registered name */}
              <h1 className="text-4xl font-black text-[#1B2559]">Welcome back, {adminProfile.name} 👋</h1>
              <p className="text-[#A3AED0] mt-2 font-bold tracking-wide">Here is what is happening in your classes today.</p>
            </div>
            
            <div className="flex gap-4 mt-6 md:mt-0">
              <div className="bg-white px-6 py-4 rounded-3xl shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4">
                <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                </div>
                <div>
                  <p className="text-xs font-black text-[#A3AED0] uppercase tracking-wider">Total Students</p>
                  <p className="text-2xl font-black text-[#1B2559]">{students.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 🟢 VIEW 1: DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in">
              
              {/* ASSIGN WORK FORM */}
              <div className="xl:col-span-5 bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] h-fit">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-indigo-600 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#1B2559]">Create Task</h2>
                </div>
                
                <form onSubmit={handleAssignSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Task Title</label>
                    <input className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/20 text-[#1B2559] outline-none transition-all font-bold" 
                      placeholder="e.g., Advanced Calculus Chapter 2" required value={assignForm.title}
                      onChange={e => setAssignForm({...assignForm, title: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Assign To</label>
                      <select className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]" 
                        onChange={e => setAssignForm({...assignForm, studentId: e.target.value})}>
                        <option value="all">All Students</option>
                        {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Difficulty</label>
                      <select className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]" 
                        onChange={e => setAssignForm({...assignForm, difficulty: e.target.value})}>
                        <option value="Easy">Easy 🟢</option>
                        <option value="Medium">Medium 🟡</option>
                        <option value="Hard">Hard 🔴</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-indigo-500 uppercase tracking-wide ml-1">Deadline Date & Time</label>
                    <input type="datetime-local" required min={minDateTime}
                      className="w-full p-4 bg-indigo-50 border-none text-indigo-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-black cursor-pointer" 
                      value={assignForm.dueDate}
                      onChange={e => setAssignForm({...assignForm, dueDate: e.target.value})} />
                  </div>

                  <div className="space-y-1 pt-4 border-t border-slate-100">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Format Type</label>
                    <select className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl font-bold text-[#1B2559] outline-none mb-4 cursor-pointer" 
                      value={assignForm.type} onChange={e => setAssignForm({...assignForm, type: e.target.value})}>
                      <option value="File">Upload File (PDF/Image)</option>
                      <option value="Text">Write Question</option>
                      <option value="MCQ">Build Quiz (MCQ)</option>
                    </select>

                    <div className="animate-fade-in">
                      {assignForm.type === 'File' && (
                        <div className="relative border-2 border-dashed border-indigo-300 bg-[#F4F7FE] rounded-3xl p-10 text-center hover:bg-indigo-50 transition-colors cursor-pointer group">
                          <input type="file" accept=".pdf, image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileUpload} />
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform text-3xl">📁</div>
                          <p className="font-black text-[#1B2559]">Drag & Drop or Click</p>
                          <p className="text-xs font-bold text-[#A3AED0] mt-1">PDF, JPG, PNG up to 5MB</p>
                          {isUploading && <p className="mt-3 text-sm font-bold text-amber-500">Processing file...</p>}
                          {fileName && !isUploading && <p className="mt-3 inline-block bg-white text-indigo-800 px-4 py-2 rounded-full text-xs font-bold shadow-sm">{fileName}</p>}
                        </div>
                      )}

                      {assignForm.type === 'Text' && (
                        <textarea className="w-full p-5 bg-[#F4F7FE] border-none rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-[#1B2559] font-medium min-h-[160px]" 
                          placeholder="Type instructions or complete text here..." 
                          value={assignForm.content} onChange={e => setAssignForm({...assignForm, content: e.target.value})} />
                      )}

                      {assignForm.type === 'MCQ' && (
                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                          {assignForm.mcqs.map((mcq, qIndex) => (
                            <div key={qIndex} className="p-5 bg-[#F4F7FE] rounded-3xl">
                              <input className="w-full p-2 mb-3 font-black border-b-2 border-slate-200 bg-transparent outline-none focus:border-indigo-500 text-[#1B2559]" 
                                placeholder={`Question ${qIndex + 1}`} value={mcq.question} 
                                onChange={(e) => updateMcq(qIndex, 'question', e.target.value)} />
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                {mcq.options.map((opt, oIndex) => (
                                  <input key={oIndex} className="p-3 text-sm border-none rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-400 font-bold" 
                                    placeholder={`Option ${oIndex + 1}`} value={opt} 
                                    onChange={(e) => updateMcq(qIndex, 'options', e.target.value, oIndex)} />
                                ))}
                              </div>
                              <div className="flex items-center gap-3">
                                <label className="text-xs font-black text-[#A3AED0] uppercase">Correct Answer:</label>
                                <select className="p-2 text-sm font-black border-none rounded-xl bg-emerald-100 text-emerald-800 outline-none" 
                                  value={mcq.correctOption} onChange={(e) => updateMcq(qIndex, 'correctOption', parseInt(e.target.value))}>
                                  <option value={0}>Option 1</option><option value={1}>Option 2</option><option value={2}>Option 3</option><option value={3}>Option 4</option>
                                </select>
                              </div>
                            </div>
                          ))}
                          <button type="button" onClick={addMcq} className="w-full py-4 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-3xl font-black hover:bg-indigo-50 transition-colors">
                            + Add Next Question
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button className="w-full bg-[#1B2559] hover:bg-indigo-600 text-white font-black py-5 rounded-2xl transition-all shadow-[0_18px_40px_rgba(112,144,176,0.2)] text-lg flex items-center justify-center gap-2 transform hover:-translate-y-1">
                    Publish Assignment
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </button>
                </form>
              </div>

              {/* TRACKER BOARD */}
              <div className="xl:col-span-7 bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex flex-col h-fit md:min-h-[800px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 w-2 h-8 rounded-full"></div>
                    <h2 className="text-2xl font-black text-[#1B2559]">Submissions Board</h2>
                  </div>
                  <div className="relative w-full md:w-72">
                    <svg className="w-5 h-5 absolute left-4 top-4 text-[#A3AED0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input type="text" placeholder="Search tasks..." 
                      className="w-full py-3 pl-12 pr-4 bg-[#F4F7FE] rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-[#1B2559]"
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
                
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {filteredHomeworks.map(hw => {
                    const isLate = new Date() > new Date(hw.dueDate);

                    return (
                      <div key={hw._id} className="p-6 bg-white border border-slate-100 hover:bg-[#F4F7FE]/50 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 transition-all hover:shadow-lg group">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-black text-xl text-[#1B2559]">{hw.title}</h3>
                            <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider
                              ${hw.status === 'Pending' ? 'bg-slate-100 text-slate-500' : 
                                hw.status === 'Submitted' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                              {hw.status}
                            </span>
                          </div>
                          
                          <p className="text-sm text-[#A3AED0] font-bold mb-4">Assigned to: <span className="font-black text-[#1B2559]">{hw.studentId?.name || "Deleted User"}</span></p>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-[#F4F7FE] text-[#A3AED0] px-3 py-1.5 rounded-xl text-xs font-black">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                              {new Date(hw.dueDate).toLocaleString()}
                            </div>
                            {isLate && hw.status === 'Pending' && <span className="bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-xs font-black">Overdue</span>}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                          {hw.status === 'Pending' && (
                            <button onClick={() => setModal({ type: 'extend', hwId: hw._id, data: '' })} className="px-5 py-3 bg-white border border-indigo-200 text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm text-sm">
                              + Extend Date
                            </button>
                          )}
                          
                          {hw.status === 'Submitted' && (
                            <>
                              {/* 🌟 Triggers the inline preview modal instead of new tab */}
                              {hw.submission && (hw.submission.answerFileUrl || hw.submission.answerText) && (
                                <button onClick={() => setModal({ type: 'viewWork', hwId: hw._id, data: hw.submission, title: hw.title })} className="px-5 py-3 bg-[#1B2559] text-white font-black rounded-2xl hover:bg-indigo-900 transition-colors shadow-md text-sm">
                                  View Work
                                </button>
                              )}
                              <button onClick={() => setModal({ type: 'grade', hwId: hw._id, data: '' })} className="px-5 py-3 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 transition-transform hover:-translate-y-1 shadow-md text-sm flex items-center gap-2">
                                Grade
                              </button>
                            </>
                          )}
                          
                          {hw.status === 'Graded' && (
                            <div className="flex items-center gap-2">
                              <div className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl font-black border border-emerald-100 text-lg">
                                {hw.grading?.score != null ? `${hw.grading.score}/100` : 'No Score'}
                              </div>
                              {/* 🌟 NEW: Button to remove the Answer Sheet */}
                              {hw.grading?.adminAnswerSheetUrl && (
                                <button onClick={() => setModal({ type: 'deleteAnsSheet', hwId: hw._id, data: { score: hw.grading.score } })} className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-colors shadow-sm text-sm font-bold" title="Delete Answer Sheet">
                                  Remove Ans Sheet
                                </button>
                              )}
                            </div>
                          )}

                          <button onClick={() => setModal({ type: 'delete', hwId: hw._id, data: '' })} className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-colors shadow-sm ml-2 text-xl" title="Delete">
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredHomeworks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                      <div className="text-6xl mb-6 opacity-50">📂</div>
                      <p className="text-[#1B2559] font-black text-xl mb-1">Inbox Zero!</p>
                      <p className="text-[#A3AED0] font-bold">Assign new work on the left side to get started.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 🟢 VIEW 2: STUDENT LIST TAB */}
          {activeTab === 'students' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-purple-500 w-2 h-8 rounded-full"></div>
                <h2 className="text-2xl font-black text-[#1B2559]">Enrolled Students Roster</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {students.map(student => {
                  // Calculate Stats for this specific student
                  const studentHw = homeworks.filter(h => h.studentId?._id === student._id);
                  const completedCount = studentHw.filter(h => h.status === 'Graded').length;
                  const pendingCount = studentHw.filter(h => h.status === 'Submitted').length;

                  // 🌟 NEW ADDITION: Calculate Average Score and Progress Bar Width
                  const gradedHw = studentHw.filter(h => h.status === 'Graded');
                  const avgScore = gradedHw.length > 0 ? (gradedHw.reduce((acc, curr) => acc + (curr.grading?.score || 0), 0) / gradedHw.length).toFixed(1) : 0;
                  const progressWidth = `${avgScore}%`;

                  return (
                    <div key={student._id} className="bg-[#F4F7FE] p-6 rounded-3xl flex flex-col gap-4 hover:shadow-lg transition-shadow border border-transparent hover:border-indigo-100">
                      
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-md">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-black text-[#1B2559] text-xl">{student.name}</h3>
                          <p className="text-sm font-bold text-[#A3AED0] mb-2">{student.email}</p>
                          <div className="flex gap-2">
                            <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2 py-1 rounded-lg">{completedCount} Completed</span>
                            <span className="bg-amber-100 text-amber-700 text-xs font-black px-2 py-1 rounded-lg">{pendingCount} Review</span>
                          </div>
                        </div>
                        
                        </div>

                      {/* 🌟 NEW ADDITION: Progress Bar based on Avg Score */}
                      <div className="w-full bg-white p-3 rounded-2xl shadow-sm mt-2">
                        <div className="flex justify-between text-xs font-black text-[#A3AED0] mb-2">
                          <span>Average Performance</span>
                          <span className={avgScore >= 80 ? 'text-emerald-500' : avgScore >= 50 ? 'text-amber-500' : 'text-rose-500'}>{avgScore}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className={`h-2 rounded-full ${avgScore >= 80 ? 'bg-emerald-500' : avgScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: progressWidth }}></div>
                        </div>
                      </div>

                    </div>
                  );
                })}

                {students.length === 0 && (
                  <div className="col-span-full text-center py-20 text-[#A3AED0] font-bold">
                    No students have registered yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 🟢 VIEW 3: SETTINGS TAB (Profile & Danger Zone) */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-fade-in">
              
              {/* Profile Settings */}
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)]">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                  <div className="bg-indigo-500 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#1B2559]">Profile Settings</h2>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      {settingsForm.profilePic ? (
                        <img src={settingsForm.profilePic} alt="Profile" className="w-24 h-24 rounded-3xl object-cover shadow-md" />
                      ) : (
                        <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center text-4xl shadow-md">👤</div>
                      )}
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-3xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicUpload} />
                        <span className="text-xs font-bold">Upload</span>
                      </label>
                    </div>
                    <div>
                      <h3 className="font-black text-[#1B2559]">Profile Picture</h3>
                      <p className="text-xs font-bold text-[#A3AED0]">JPG, PNG under 2MB</p>
                      {isProfileUploading && <p className="text-xs text-amber-500 mt-1">Uploading...</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Display Name</label>
                    <input type="text" className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold text-[#1B2559]" 
                      value={settingsForm.name} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} />
                  </div>

                  <button onClick={handleSaveSettings} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg transition-transform hover:-translate-y-1">
                    Save Profile Update
                  </button>
                </div>
              </div>

              {/* Danger Zone: Delete Student */}
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] h-fit">
                <div className="flex items-center gap-3 mb-8 border-b border-rose-100 pb-6">
                  <div className="bg-rose-500 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-rose-600">Danger Zone</h2>
                </div>

                <div className="space-y-6">
                  <p className="text-sm font-bold text-slate-500">Remove a student from the platform. This action is permanent and deletes all their coursework.</p>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-black text-rose-400 uppercase tracking-wide">Select Student to Delete</label>
                    <select className="w-full p-4 bg-rose-50 text-rose-900 border border-rose-100 rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/20 font-bold" 
                      value={settingsForm.studentToDelete} onChange={e => setSettingsForm({...settingsForm, studentToDelete: e.target.value})}>
                      <option value="">-- Choose a Student --</option>
                      {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                    </select>
                  </div>

                  <button 
                    onClick={() => {
                      if (!settingsForm.studentToDelete) return showToast("Select a student first!", "error");
                      setModal({ type: 'deleteStudent', studentId: settingsForm.studentToDelete, data: '' });
                    }} 
                    className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl shadow-lg transition-transform hover:-translate-y-1"
                  >
                    Delete Selected Student
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}