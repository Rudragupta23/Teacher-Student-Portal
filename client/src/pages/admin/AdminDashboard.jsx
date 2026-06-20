import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Users, FileText, Settings, LogOut, PlusCircle, CheckCircle2, UploadCloud } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'students', 'assignments'
  
  // Filter States
  const [selectedQual, setSelectedQual] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  
  // Question Form State
  const [difficulty, setDifficulty] = useState('Easy');
  const [questionType, setQuestionType] = useState('Text');

  // Handle Cascading Resets
  const handleQualChange = (e) => {
    setSelectedQual(e.target.value);
    setSelectedChapter(''); // Reset children
    setSelectedTopic('');
  };

  const handleChapterChange = (e) => {
    setSelectedChapter(e.target.value);
    setSelectedTopic(''); // Reset child
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      
      {/* SIDEBAR */}
      <motion.div 
        initial={{ x: -250 }} animate={{ x: 0 }}
        className="w-64 bg-[#0f172a] text-white flex flex-col shadow-2xl z-20"
      >
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
            MathCom Mentors
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">Admin Console</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarButton icon={<PlusCircle size={20}/>} label="Add Questions" active={activeTab === 'upload'} onClick={() => setActiveTab('upload')} />
          <SidebarButton icon={<Users size={20}/>} label="Manage Students" active={activeTab === 'students'} onClick={() => setActiveTab('students')} />
          <SidebarButton icon={<FileText size={20}/>} label="Active Homework" active={activeTab === 'assignments'} onClick={() => setActiveTab('assignments')} />
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
            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Question Bank</h2>
            <p className="text-gray-500 font-medium mt-1">Upload and categorize questions for the adaptive algorithm.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg">
              A
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8 max-w-6xl mx-auto">
          {activeTab === 'upload' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              
              <div className="p-8 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <BookOpen className="text-indigo-600" /> Categorize Question
                </h3>
                
                {/* CASCADING FILTERS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Qualification Dropdown */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Qualification</label>
                    <select value={selectedQual} onChange={handleQualChange} className="w-full p-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-700 shadow-sm">
                      <option value="">Select Qualification...</option>
                      {Object.keys(filterData).map(qual => (
                        <option key={qual} value={qual}>{qual}</option>
                      ))}
                    </select>
                  </div>

                  {/* Chapter Dropdown (Depends on Qualification) */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Chapter</label>
                    <select value={selectedChapter} onChange={handleChapterChange} disabled={!selectedQual} className="w-full p-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-700 shadow-sm disabled:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed">
                      <option value="">Select Chapter...</option>
                      {selectedQual && Object.keys(filterData[selectedQual]).map(chapter => (
                        <option key={chapter} value={chapter}>{chapter}</option>
                      ))}
                    </select>
                  </div>

                  {/* Topic Dropdown (Depends on Chapter) */}
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

                {/* Auto-Grader Answer */}
                <div className="mb-8 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <label className="block text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
                    <CheckCircle2 size={18} /> Auto-Grader Correct Answer
                  </label>
                  <input type="text" placeholder="e.g. 45 or x=2" className="w-full p-3.5 bg-white border border-emerald-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium text-gray-700 shadow-sm" />
                  <p className="text-xs text-emerald-600 mt-2">The system will use this to automatically grade student submissions.</p>
                </div>

                <div className="flex justify-end">
                  <button className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transform transition-all hover:scale-[1.02] active:scale-95">
                    Save to Question Bank
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {/* Placeholder for other tabs */}
          {activeTab !== 'upload' && (
            <div className="h-96 flex items-center justify-center text-gray-400 font-medium text-lg border-2 border-dashed border-gray-200 rounded-3xl">
              {activeTab === 'students' ? 'Student Management UI coming next...' : 'Active Homework UI coming next...'}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// Reusable Sidebar Button Component
const SidebarButton = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all outline-none
      ${active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
        : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
  >
    {icon}
    {label}
  </button>
);

export default AdminDashboard;