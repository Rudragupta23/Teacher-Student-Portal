import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Users, FileText, LogOut, PlusCircle, CheckCircle2, UploadCloud, Send, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../../services/api';

// --- FILTER DATA LOGIC ---
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
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'assign', 'grading'
  
  // Data States
  const [students, setStudents] = useState([]);
  const [homeworks, setHomeworks] = useState([]);

  // --- UPLOAD TAB STATES ---
  const [selectedQual, setSelectedQual] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [questionType, setQuestionType] = useState('Text');

  // --- ASSIGN TAB STATES ---
  const [assignData, setAssignData] = useState({ title: '', description: '', studentId: 'all', difficulty: 'Mixed' });

  // --- GRADING TAB STATES ---
  const [gradeData, setGradeData] = useState({ score: '', feedback: '', canDoEasy: true, canDoMedium: false, canDoHard: false });

  // Initial Data Fetch
  useEffect(() => {
    // In a real app, you would fetch real students: api.get('/auth/students').then(res => setStudents(res.data));
    // Mocking students for UI demonstration
    setStudents([
      { _id: '1', name: 'John Doe (Foundation)' }, 
      { _id: '2', name: 'Jane Smith (Higher)' }
    ]);
    fetchHomeworks();
  }, []);

  const fetchHomeworks = async () => {
    try {
      const res = await api.get('/homework/admin');
      setHomeworks(res.data);
    } catch (err) {
      console.log("Failed to load homework", err);
    }
  };

  // Cascading Dropdown Handlers
  const handleQualChange = (e) => {
    setSelectedQual(e.target.value);
    setSelectedChapter(''); 
    setSelectedTopic('');
  };

  const handleChapterChange = (e) => {
    setSelectedChapter(e.target.value);
    setSelectedTopic(''); 
  };

  // Submit Handlers
  const handleUploadQuestion = (e) => {
    e.preventDefault();
    toast.success('Question added to the bank successfully!');
    // Reset form or handle API logic here
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/homework/assign', assignData);
      toast.success('Homework Assigned Successfully!');
      setAssignData({ title: '', description: '', studentId: 'all', difficulty: 'Mixed' });
      fetchHomeworks();
    } catch (error) {
      toast.error('Failed to assign homework. Make sure backend routes are connected.');
    }
  };

  const handleGrade = async (hwId) => {
    try {
      await api.post(`/homework/grade/${hwId}`, gradeData);
      toast.success('Graded successfully! Adaptive algorithm updated.');
      fetchHomeworks();
    } catch (error) {
      toast.error('Failed to submit grade.');
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      <Toaster position="top-center" />
      
      {/* SIDEBAR */}
      <motion.div initial={{ x: -250 }} animate={{ x: 0 }} className="w-64 bg-[#0f172a] text-white flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
            MathCom Mentors
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">Admin Console</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarButton icon={<PlusCircle size={20}/>} label="Question Bank" active={activeTab === 'upload'} onClick={() => setActiveTab('upload')} />
          <SidebarButton icon={<Send size={20}/>} label="Assign Work" active={activeTab === 'assign'} onClick={() => setActiveTab('assign')} />
          <SidebarButton icon={<CheckCircle2 size={20}/>} label="Grading & Review" active={activeTab === 'grading'} onClick={() => setActiveTab('grading')} />
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button className="flex items-center gap-3 text-gray-400 hover:text-red-400 transition-colors w-full p-3 rounded-xl hover:bg-red-400/10 font-medium">
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </motion.div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Header */}
        <header className="bg-white px-8 py-6 shadow-sm sticky top-0 z-10 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
              {activeTab === 'upload' ? 'Question Bank' : activeTab === 'assign' ? 'Assign Homework' : 'Student Submissions'}
            </h2>
            <p className="text-gray-500 font-medium mt-1">
              {activeTab === 'upload' ? 'Upload and categorize questions.' : activeTab === 'assign' ? 'Deploy adaptive tasks to students.' : 'Review work and update adaptive profiles.'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg">
              A
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: QUESTION BANK (UPLOAD) */}
            {activeTab === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-8 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <BookOpen className="text-indigo-600" /> Categorize Question
                  </h3>
                  
                  {/* CASCADING FILTERS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Qualification</label>
                      <select value={selectedQual} onChange={handleQualChange} className="w-full p-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-700 shadow-sm">
                        <option value="">Select Qualification...</option>
                        {Object.keys(filterData).map(qual => (
                          <option key={qual} value={qual}>{qual}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Chapter</label>
                      <select value={selectedChapter} onChange={handleChapterChange} disabled={!selectedQual} className="w-full p-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-700 shadow-sm disabled:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed">
                        <option value="">Select Chapter...</option>
                        {selectedQual && Object.keys(filterData[selectedQual]).map(chapter => (
                          <option key={chapter} value={chapter}>{chapter}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Specific Topic</label>
                      <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} disabled={!selectedChapter} className="w-full p-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-700 shadow-sm disabled:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed">
                        <option value="">Select Topic...</option>
                        {selectedChapter && filterData[selectedQual][selectedChapter].map(topic => (
                          <option key={topic} value={topic}>{topic}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* QUESTION DETAILS FORM */}
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty Level</label>
                      <div className="flex bg-gray-100 p-1 rounded-xl">
                        {['Easy', 'Medium', 'Hard'].map(lvl => (
                          <button key={lvl} onClick={() => setDifficulty(lvl)} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${difficulty === lvl ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Question Format</label>
                      <div className="flex bg-gray-100 p-1 rounded-xl">
                        {['Text', 'MCQ', 'Image/PDF'].map(type => (
                          <button key={type} onClick={() => setQuestionType(type)} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${questionType === type ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}>
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Question Content</label>
                    {questionType === 'Image/PDF' ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center bg-gray-50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-colors cursor-pointer">
                        <UploadCloud size={48} className="text-indigo-400 mb-4" />
                        <p className="text-gray-700 font-semibold mb-1">Click to upload or drag and drop</p>
                        <p className="text-gray-500 text-sm">SVG, PNG, JPG or PDF (max. 5MB)</p>
                      </div>
                    ) : (
                      <textarea rows="5" placeholder="Type your question here..." className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"></textarea>
                    )}
                  </div>

                  <div className="mb-8 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <label className="block text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
                      <CheckCircle2 size={18} /> Auto-Grader Correct Answer
                    </label>
                    <input type="text" placeholder="e.g. 45 or x=2" className="w-full p-3.5 bg-white border border-emerald-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium text-gray-700 shadow-sm" />
                    <p className="text-xs text-emerald-600 mt-2">The system will use this to automatically grade student submissions.</p>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={handleUploadQuestion} className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transform transition-all hover:scale-[1.02] active:scale-95">
                      Save to Question Bank
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: ASSIGN HOMEWORK */}
            {activeTab === 'assign' && (
              <motion.div key="assign" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 max-w-4xl mx-auto">
                <form onSubmit={handleAssign} className="space-y-6">
                  <div>
                    <label className="block font-bold text-gray-700 mb-2">Assign To:</label>
                    <select value={assignData.studentId} onChange={(e) => setAssignData({...assignData, studentId: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 outline-none font-medium text-gray-700">
                      <option value="all">All Students (Class Broadcast)</option>
                      {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-2">Assignment Title:</label>
                    <input type="text" required value={assignData.title} onChange={(e) => setAssignData({...assignData, title: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 outline-none font-medium" placeholder="e.g. Algebra Fundamentals Quiz" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-2">Difficulty Profile (For Adaptive Algorithm):</label>
                    <select value={assignData.difficulty} onChange={(e) => setAssignData({...assignData, difficulty: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 outline-none font-medium text-gray-700">
                      <option value="Mixed">Mixed (Standard Distribution)</option>
                      <option value="Easy">Easy Focus (Foundation)</option>
                      <option value="Medium">Medium Focus</option>
                      <option value="Hard">Hard Focus (Advanced)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-2">Instructions / Custom Questions:</label>
                    <textarea rows="4" value={assignData.description} onChange={(e) => setAssignData({...assignData, description: e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 outline-none resize-none" placeholder="Type instructions or link attached files here..."></textarea>
                  </div>
                  <button type="submit" className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.01] active:scale-95 mt-4">
                    Deploy Assignment
                  </button>
                </form>
              </motion.div>
            )}

            {/* TAB 3: GRADING & REVIEW */}
            {activeTab === 'grading' && (
              <motion.div key="grading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 max-w-4xl mx-auto">
                
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-center gap-4 text-amber-800 shadow-sm">
                  <AlertCircle size={24} className="shrink-0" />
                  <p className="font-medium text-sm md:text-base">Reviewing submissions and updating adaptive profiles determines the difficulty of the next assignments generated for these students.</p>
                </div>

                {/* Mocking an empty state if no homeworks */}
                {homeworks.filter(hw => hw.status === 'Submitted').length === 0 && (
                  <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <CheckCircle2 size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium text-lg">No pending submissions to grade.</p>
                    <p className="text-gray-400 text-sm mt-1">All caught up!</p>
                  </div>
                )}

                {/* List Submissions */}
                {homeworks.filter(hw => hw.status === 'Submitted').map(hw => (
                  <div key={hw._id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">{hw.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">Student: <span className="font-bold text-indigo-600">{hw.studentId?.name || 'Unknown Student'}</span></p>
                      </div>
                      <span className="px-4 py-1.5 bg-yellow-100 text-yellow-800 font-bold text-xs rounded-full uppercase tracking-widest">Needs Grading</span>
                    </div>
                    
                    <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-200">
                      <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Student's Answer</p>
                      <p className="text-gray-800 font-medium whitespace-pre-wrap">{hw.submission?.answerText || 'No text provided. (File attached)'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-8">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Score (out of 100)</label>
                        <input type="number" onChange={(e) => setGradeData({...gradeData, score: e.target.value})} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 outline-none font-bold text-gray-700" placeholder="e.g. 85" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Adaptive Evaluation (Select Passed Levels)</label>
                        <div className="flex flex-col gap-3">
                          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border border-gray-200 hover:border-indigo-300 transition-colors">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" onChange={e => setGradeData({...gradeData, canDoEasy: e.target.checked})} defaultChecked /> 
                            <span className="font-semibold text-gray-700">Easy (Foundation Mastery)</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border border-gray-200 hover:border-indigo-300 transition-colors">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" onChange={e => setGradeData({...gradeData, canDoMedium: e.target.checked})} /> 
                            <span className="font-semibold text-gray-700">Medium (Standard Mastery)</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border border-gray-200 hover:border-indigo-300 transition-colors">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" onChange={e => setGradeData({...gradeData, canDoHard: e.target.checked})} /> 
                            <span className="font-semibold text-gray-700">Hard (Advanced Mastery)</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <button onClick={() => handleGrade(hw._id)} className="mt-8 px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all transform hover:scale-[1.01] active:scale-95 w-full md:w-auto shadow-lg shadow-emerald-200">
                      Publish Grade & Update Algorithm
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

// Reusable Sidebar Button Component
const SidebarButton = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-bold transition-all outline-none
      ${active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 transform scale-[1.02]' 
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
  >
    {icon}
    {label}
  </button>
);

export default AdminDashboard;