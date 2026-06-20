import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle2, UploadCloud, Send, AlertCircle, LogOut } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('assign'); 
  const { logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [homeworks, setHomeworks] = useState([]);

  // Assignment State (Adaptive Breakdown)
  const [assignData, setAssignData] = useState({ 
    title: '', description: '', studentId: 'all', topic: 'Algebra', 
    easyCount: 8, mediumCount: 2, hardCount: 0 
  });

  // Grading State
  const [gradeData, setGradeData] = useState({ score: '', feedback: '', canDoEasy: true, canDoMedium: false, canDoHard: false });

  useEffect(() => {
    fetchStudents();
    fetchHomeworks();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/students'); // Ensure this route exists in adminRoutes.js
      setStudents(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchHomeworks = async () => {
    try {
      const res = await api.get('/homework/admin');
      setHomeworks(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/homework/assign', assignData);
      toast.success('Homework Assigned & Students Notified!');
      setAssignData({ ...assignData, title: '', description: '' });
      fetchHomeworks();
    } catch (error) {
      toast.error('Failed to assign homework.');
    }
  };

  const handleGrade = async (hwId) => {
    try {
      await api.post(`/homework/grade/${hwId}`, gradeData);
      toast.success('Graded! Score saved and task removed from active list.');
      fetchHomeworks(); // Will refresh and remove the graded homework from the list
    } catch (error) {
      toast.error('Failed to submit grade.');
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      <Toaster position="top-center" />
      
      {/* SIDEBAR */}
      <motion.div initial={{ x: -250 }} animate={{ x: 0 }} className="w-64 bg-[#0f172a] text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">MathCom Mentors</h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">Admin Console</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarButton icon={<Send size={20}/>} label="Assign Work" active={activeTab === 'assign'} onClick={() => setActiveTab('assign')} />
          <SidebarButton icon={<CheckCircle2 size={20}/>} label="Grading & Review" active={activeTab === 'grading'} onClick={() => setActiveTab('grading')} />
          <SidebarButton icon={<UploadCloud size={20}/>} label="Question Bank" active={activeTab === 'upload'} onClick={() => setActiveTab('upload')} />
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 hover:text-white hover:bg-red-500 transition-all w-full p-3 rounded-xl font-bold">
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </motion.div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto relative">
        <header className="bg-white px-8 py-6 shadow-sm sticky top-0 z-10 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
              {activeTab === 'assign' ? 'Adaptive Assignment' : activeTab === 'grading' ? 'Student Submissions' : 'Question Bank'}
            </h2>
            <p className="text-gray-500 font-medium mt-1">Total Students Enrolled: {students.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg">A</div>
        </header>

        <main className="p-8 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: ASSIGN ADAPTIVE HOMEWORK */}
            {activeTab === 'assign' && (
              <motion.div key="assign" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 max-w-4xl mx-auto">
                <form onSubmit={handleAssign} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-bold text-gray-700 mb-2">Assign To:</label>
                      <select value={assignData.studentId} onChange={(e) => setAssignData({...assignData, studentId: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 outline-none font-medium text-gray-700">
                        <option value="all">All Students (Class Broadcast)</option>
                        {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-2">Assignment Title:</label>
                      <input type="text" required value={assignData.title} onChange={(e) => setAssignData({...assignData, title: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium" placeholder="e.g. Week 1: Algebra" />
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                    <label className="block font-bold text-indigo-900 mb-4">Adaptive Question Algorithm (Auto-Fetch from Bank):</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Easy Qs</label>
                        <input type="number" min="0" value={assignData.easyCount} onChange={e => setAssignData({...assignData, easyCount: e.target.value})} className="w-full p-3 rounded-lg border border-gray-200 outline-none text-center font-bold" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Medium Qs</label>
                        <input type="number" min="0" value={assignData.mediumCount} onChange={e => setAssignData({...assignData, mediumCount: e.target.value})} className="w-full p-3 rounded-lg border border-gray-200 outline-none text-center font-bold" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Hard Qs</label>
                        <input type="number" min="0" value={assignData.hardCount} onChange={e => setAssignData({...assignData, hardCount: e.target.value})} className="w-full p-3 rounded-lg border border-gray-200 outline-none text-center font-bold" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-2">Additional Instructions (Or Full Text Questions):</label>
                    <textarea rows="4" value={assignData.description} onChange={(e) => setAssignData({...assignData, description: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 outline-none resize-none" placeholder="Provide extra context here..."></textarea>
                  </div>
                  
                  <button type="submit" className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.01] active:scale-95">
                    Deploy Assignment
                  </button>
                </form>
              </motion.div>
            )}

            {/* TAB 2: GRADING & REVIEW */}
            {activeTab === 'grading' && (
              <motion.div key="grading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-center gap-4 text-amber-800 shadow-sm">
                  <AlertCircle size={24} className="shrink-0" />
                  <p className="font-medium text-sm md:text-base">Submissions will be automatically deleted from the database once graded, leaving only the permanent score on the student's profile.</p>
                </div>

                {homeworks.filter(hw => hw.status === 'Submitted').length === 0 && (
                  <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <CheckCircle2 size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium text-lg">No pending submissions to grade.</p>
                  </div>
                )}

                {homeworks.filter(hw => hw.status === 'Submitted').map(hw => (
                  <div key={hw._id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">{hw.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">Student: <span className="font-bold text-indigo-600">{hw.studentId?.name || 'Unknown Student'}</span></p>
                      </div>
                      <span className="px-4 py-1.5 bg-yellow-100 text-yellow-800 font-bold text-xs rounded-full uppercase tracking-widest animate-pulse">Needs Grading</span>
                    </div>
                    
                    <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-200">
                      <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Student's Answer</p>
                      <p className="text-gray-800 font-medium whitespace-pre-wrap">{hw.submission?.answerText || 'No text provided.'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-8">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Score (out of 100)</label>
                        <input type="number" onChange={(e) => setGradeData({...gradeData, score: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-gray-700" placeholder="e.g. 85" />
                        
                        <label className="block text-sm font-bold text-gray-700 mt-4 mb-2">Teacher Feedback</label>
                        <input type="text" onChange={(e) => setGradeData({...gradeData, feedback: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 outline-none font-medium" placeholder="e.g. Great logic!" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Update Adaptive Profile</label>
                        <div className="flex flex-col gap-3">
                          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border border-gray-200 hover:border-indigo-300">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" onChange={e => setGradeData({...gradeData, canDoEasy: e.target.checked})} defaultChecked /> 
                            <span className="font-semibold text-gray-700">Mastered Easy Concepts</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border border-gray-200 hover:border-indigo-300">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" onChange={e => setGradeData({...gradeData, canDoMedium: e.target.checked})} /> 
                            <span className="font-semibold text-gray-700">Mastered Medium Concepts</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border border-gray-200 hover:border-indigo-300">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" onChange={e => setGradeData({...gradeData, canDoHard: e.target.checked})} /> 
                            <span className="font-semibold text-gray-700">Mastered Hard Concepts</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <button onClick={() => handleGrade(hw._id)} className="mt-8 px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all w-full shadow-lg shadow-emerald-200">
                      Publish Grade & Delete Homework Task
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
            
            {/* TAB 3: Question Bank (Placeholder for file uploads) */}
            {activeTab === 'upload' && (
               <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                 <h2 className="text-2xl font-bold text-gray-800">Question Bank System Connected</h2>
                 <p className="text-gray-500 mt-2">Questions uploaded here feed the Adaptive Algorithm in the Assign tab.</p>
               </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const SidebarButton = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-bold transition-all outline-none ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
    {icon} {label}
  </button>
);

export default AdminDashboard;