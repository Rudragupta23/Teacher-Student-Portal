import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle2, UploadCloud, LogOut, Clock, Activity } from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [homeworks, setHomeworks] = useState([]);
  const [answerText, setAnswerText] = useState({});
  const { user, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyHomework();
  }, []);

  const fetchMyHomework = async () => {
    try {
      const res = await api.get('/homework/student');
      setHomeworks(res.data);
    } catch (error) {
      toast.error("Error loading homework");
    }
  };

  const handleSubmit = async (hwId) => {
    if(!answerText[hwId]) return toast.error("Please provide an answer.");
    try {
      await api.post(`/homework/submit/${hwId}`, { answerText: answerText[hwId] });
      toast.success('Homework Submitted to Teacher! An alert has been sent.');
      fetchMyHomework();
    } catch (error) {
      toast.error('Failed to submit');
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-12">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="bg-[#0f172a] text-white px-8 py-6 shadow-lg flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">MathCom Mentors</h1>
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full uppercase tracking-widest border border-indigo-500/30">Student Portal</span>
        </div>
        <div className="flex items-center gap-6">
          <p className="font-medium text-gray-300">Welcome, {user?.name}</p>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 bg-red-400/10 px-4 py-2 rounded-lg transition-colors font-semibold">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-10 px-6">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-8 flex items-center gap-3">
          <Activity className="text-indigo-600" /> My Active Assignments
        </h2>

        <div className="grid grid-cols-1 gap-6">
          {homeworks.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
               <CheckCircle2 size={64} className="mx-auto text-emerald-400 mb-4" />
               <h3 className="text-2xl font-bold text-gray-800">You're all caught up!</h3>
               <p className="text-gray-500 mt-2">No pending assignments. Great job!</p>
            </div>
          )}

          <AnimatePresence>
            {homeworks.map(hw => (
              <motion.div key={hw._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
                
                <div className={`p-6 border-b flex justify-between items-center ${hw.status === 'Submitted' ? 'bg-blue-50 border-blue-100' : 'bg-indigo-50 border-indigo-100'}`}>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{hw.title}</h3>
                    <p className="text-sm font-semibold mt-2 text-gray-600 flex items-center gap-2">
                      <Clock size={16} /> Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleString() : 'No deadline'}
                    </p>
                  </div>
                  {hw.status === 'Pending' && <span className="px-5 py-2 bg-yellow-100 text-yellow-800 font-bold text-sm rounded-xl">To Do</span>}
                  {hw.status === 'Submitted' && <span className="px-5 py-2 bg-blue-100 text-blue-800 font-bold text-sm rounded-xl">Under Review</span>}
                </div>

                <div className="p-8">
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-700 mb-2 uppercase text-xs tracking-wider">Instructions / Questions</h4>
                    <p className="text-gray-800 font-medium whitespace-pre-wrap bg-gray-50 p-6 rounded-2xl border border-gray-100">{hw.description}</p>
                  </div>

                  {hw.status === 'Pending' ? (
                    <div className="space-y-4 border-t pt-6 mt-6">
                      <label className="font-bold text-gray-700 uppercase text-xs tracking-wider">Your Answer</label>
                      <textarea 
                        rows="5" 
                        placeholder="Type your answers here or paste a link to your work..." 
                        value={answerText[hw._id] || ''}
                        onChange={(e) => setAnswerText({...answerText, [hw._id]: e.target.value})}
                        className="w-full p-5 bg-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none font-medium shadow-inner"
                      ></textarea>
                      <button 
                        onClick={() => handleSubmit(hw._id)}
                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2 transform hover:scale-[1.01] active:scale-95"
                      >
                        <UploadCloud size={20} /> Submit Work to Teacher
                      </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 mt-6 text-center">
                      <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                      <p className="text-emerald-800 font-bold">Successfully Submitted!</p>
                      <p className="text-sm text-emerald-600 mt-1">Your teacher has been notified and is reviewing your work.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;