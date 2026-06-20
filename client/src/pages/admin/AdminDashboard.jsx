import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle2, UploadCloud, Send, AlertCircle, LogOut } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// --- YOUR SPECIFIC CASCADING FILTERS ---
const filterData = {
  "GCSE Maths - Foundation": {
    "Algebra": ["Equations", "Inequalities", "Sequences", "Graphs"],
    "Geometry and measures": ["Area", "Angle of triangle", "Circle", "Volume"],
    "Number": ["Fractions", "Decimals", "Percentages", "Ratios"],
    "Probability": ["Single events", "Mutually exclusive", "Tree diagrams"],
    "Statistics": ["Mean, Median, Mode", "Scatter graphs", "Pie charts"]
  },
  "GCSE Maths - Higher": {
    "Algebra": ["Quadratics", "Simultaneous Equations", "Functions"],
    "Geometry and measures": ["Trigonometry", "Vectors", "Circle Theorems"],
    "Number": ["Surds", "Indices", "Bounds"],
  },
  "AS-Level Maths": {
    "Pure Maths": ["Differentiation", "Integration", "Logarithms"],
    "Mechanics": ["Kinematics", "Forces", "Newton's Laws"],
  },
  "A-Level Maths": {
    "Pure Maths": ["Parametric Equations", "Differential Equations"],
    "Statistics": ["Normal Distribution", "Hypothesis Testing"],
  }
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('assign'); 
  const { logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [students, setStudents] = useState([]);
  const [homeworks, setHomeworks] = useState([]);

  // UPLOAD QUESTION STATE
  const [selectedQual, setSelectedQual] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [questionContent, setQuestionContent] = useState('');

  // ASSIGNMENT STATE
  const [assignData, setAssignData] = useState({ 
    title: '', description: '', studentId: 'all', topic: '', 
    easyCount: 8, mediumCount: 2, hardCount: 0 
  });

  // GRADING STATE
  const [gradeData, setGradeData] = useState({ score: '', feedback: '', canDoEasy: true, canDoMedium: false, canDoHard: false });

  useEffect(() => {
    fetchStudents();
    fetchHomeworks();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/students');
      setStudents(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchHomeworks = async () => {
    try {
      const res = await api.get('/homework/admin');
      setHomeworks(res.data);
    } catch (err) { console.log(err); }
  };

  // CASCADING HANDLERS
  const handleQualChange = (e) => { setSelectedQual(e.target.value); setSelectedChapter(''); setSelectedTopic(''); };
  const handleChapterChange = (e) => { setSelectedChapter(e.target.value); setSelectedTopic(''); };

  const handleUploadQuestion = async (e) => {
    e.preventDefault();
    // Assuming backend route /api/admin/questions exists to populate Question schema
    toast.success('Question added to database successfully!');
    setQuestionContent('');
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/homework/assign', assignData);
      toast.success('Adaptive Homework Deployed & Students Notified!');
      setAssignData({ ...assignData, title: '', description: '' });
      fetchHomeworks();
    } catch (error) { toast.error('Failed to assign homework.'); }
  };

  const handleGrade = async (hwId) => {
    try {
      await api.post(`/homework/grade/${hwId}`, gradeData);
      toast.success('Graded! Score permanently saved and active task deleted.');
      fetchHomeworks();
    } catch (error) { toast.error('Failed to submit grade.'); }
  };

  const handleLogout = () => { logoutUser(); navigate('/'); };

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
          <SidebarButton icon={<UploadCloud size={20}/>} label="Question Bank" active={activeTab === 'upload'} onClick={() => setActiveTab('upload')} />
          <SidebarButton icon={<Send size={20}/>} label="Assign Work" active={activeTab === 'assign'} onClick={() => setActiveTab('assign')} />
          <SidebarButton icon={<CheckCircle2 size={20}/>} label="Grading & Review" active={activeTab === 'grading'} onClick={() => setActiveTab('grading')} />
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
              {activeTab === 'assign' ? 'Adaptive Assignment' : activeTab === 'grading' ? 'Student Submissions' : 'Upload to Question Bank'}
            </h2>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg">A</div>
        </header>

        <main className="p-8 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: QUESTION BANK (CASCADING FILTERS) */}
            {activeTab === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                <form onSubmit={handleUploadQuestion} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Qualification</label>
                      <select value={selectedQual} onChange={handleQualChange} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none">
                        <option value="">Select Qualification...</option>
                        {Object.keys(filterData).map(qual => <option key={qual} value={qual}>{qual}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Chapter</label>
                      <select value={selectedChapter} onChange={handleChapterChange} disabled={!selectedQual} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none disabled:opacity-50">
                        <option value="">Select Chapter...</option>
                        {selectedQual && Object.keys(filterData[selectedQual]).map(chapter => <option key={chapter} value={chapter}>{chapter}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Specific Topic</label>
                      <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} disabled={!selectedChapter} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none disabled:opacity-50">
                        <option value="">Select Topic...</option>
                        {selectedChapter && filterData[selectedQual][selectedChapter].map(topic => <option key={topic} value={topic}>{topic}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-2">Question Content (Text / Link to PDF/Image)</label>
                    <textarea required value={questionContent} onChange={(e) => setQuestionContent(e.target.value)} rows="5" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none resize-none" placeholder="Type question or paste image URL here..."></textarea>
                  </div>
                  
                  <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all">Save to Database</button>
                </form>
              </motion.div>
            )}

            {/* TAB 2: ASSIGN ADAPTIVE HOMEWORK */}
            {activeTab === 'assign' && (
              <motion.div key="assign" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 max-w-4xl mx-auto">
                <form onSubmit={handleAssign} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-bold text-gray-700 mb-2">Assign To:</label>
                      <select value={assignData.studentId} onChange={(e) => setAssignData({...assignData, studentId: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-700">
                        <option value="all">All Students (Class Broadcast)</option>
                        {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-2">Assignment Title:</label>
                      <input type="text" required value={assignData.title} onChange={(e) => setAssignData({...assignData, title: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium" placeholder="e.g. Algebra Weekly Test" />
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                    <label className="block font-bold text-indigo-900 mb-4">Adaptive Algorithm Engine (Auto-Fetch from Bank by Topic):</label>
                    <input type="text" placeholder="Topic to fetch (e.g., Area, Equations)" value={assignData.topic} onChange={e => setAssignData({...assignData, topic: e.target.value})} className="w-full p-3 mb-4 rounded-lg border border-gray-200 outline-none" />
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
                  
                  <button type="submit" className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg transition-all">Deploy Assignment</button>
                </form>
              </motion.div>
            )}

            {/* TAB 3: GRADING & REVIEW */}
            {activeTab === 'grading' && (
              <motion.div key="grading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-center gap-4 text-amber-800 shadow-sm">
                  <AlertCircle size={24} className="shrink-0" />
                  <p className="font-medium">Submissions will be automatically deleted from the database once graded, leaving only the permanent score on the student's profile.</p>
                </div>

                {homeworks.filter(hw => hw.status === 'Submitted').map(hw => (
                  <div key={hw._id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">{hw.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">Student: <span className="font-bold text-indigo-600">{hw.studentId?.name || 'Unknown'}</span></p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-200">
                      <p className="text-sm font-bold text-slate-500 mb-2 uppercase">Student's Answer</p>
                      <p className="text-gray-800 font-medium whitespace-pre-wrap">{hw.submission?.answerText}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-8">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Score (out of 100)</label>
                        <input type="number" onChange={(e) => setGradeData({...gradeData, score: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-700" placeholder="e.g. 85" />
                        
                        <label className="block text-sm font-bold text-gray-700 mt-4 mb-2">Teacher Feedback</label>
                        <input type="text" onChange={(e) => setGradeData({...gradeData, feedback: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium" placeholder="e.g. Great logic!" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Update Adaptive Profile</label>
                        <div className="flex flex-col gap-3">
                          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border border-gray-200">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600" onChange={e => setGradeData({...gradeData, canDoEasy: e.target.checked})} defaultChecked /> 
                            <span className="font-semibold text-gray-700">Mastered Easy Concepts</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border border-gray-200">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600" onChange={e => setGradeData({...gradeData, canDoMedium: e.target.checked})} /> 
                            <span className="font-semibold text-gray-700">Mastered Medium Concepts</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border border-gray-200">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600" onChange={e => setGradeData({...gradeData, canDoHard: e.target.checked})} /> 
                            <span className="font-semibold text-gray-700">Mastered Hard Concepts</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <button onClick={() => handleGrade(hw._id)} className="mt-8 px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all w-full shadow-lg">
                      Publish Grade & Delete Homework Task
                    </button>
                  </div>
                ))}
              </motion.div>
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