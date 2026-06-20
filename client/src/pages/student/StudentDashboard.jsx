import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, UploadCloud, LogOut, Clock, Activity, FileQuestion } from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [homeworks, setHomeworks] = useState([]);
  const [answerText, setAnswerText] = useState({});
  const { user, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => { fetchMyHomework(); }, []);

  const fetchMyHomework = async () => {
    try {
      const res = await api.get('/homework/student');
      setHomeworks(res.data);
    } catch (error) { toast.error("Error loading homework"); }
  };

  const handleSubmit = async (hwId) => {
    if(!answerText[hwId]) return toast.error("Please provide an answer.");
    try {
      await api.post(`/homework/submit/${hwId}`, { answerText: answerText[hwId] });
      toast.success('Homework Submitted! Your teacher has been notified.');
      fetchMyHomework();
    } catch (error) { toast.error('Failed to submit'); }
  };

  const handleLogout = () => { logoutUser(); navigate('/'); };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-12">
      <Toaster position="top-center" />
      
      <header className="bg-[#0f172a] text-white px-8 py-6 shadow-lg flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">MathCom Mentors</h1>
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full uppercase tracking-widest border border-indigo-500/30">Student Portal</span>
        </div>
        <div className="flex items-center gap-6">
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
            </div>
          )}

          <AnimatePresence>
            {homeworks.map(hw => (
              <motion.div key={hw._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
                <div className="p-6 border-b bg-indigo-50 flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{hw.title}</h3>
                  </div>
                  {hw.status === 'Pending' && <span className="px-5 py-2 bg-yellow-100 text-yellow-800 font-bold text-sm rounded-xl">To Do</span>}
                  {hw.status === 'Submitted' && <span className="px-5 py-2 bg-blue-100 text-blue-800 font-bold text-sm rounded-xl">Under Review</span>}
                </div>

                <div className="p-8">
                  {hw.questions && hw.questions.length > 0 && (
                    <div className="mb-8">
                       <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
                         <FileQuestion size={18} /> Assigned Questions ({hw.questions.length})
                       </h4>
                       <div className="space-y-4">
                         {hw.questions.map((q, index) => (
                           <div key={q._id} className="p-4 border border-indigo-100 bg-white rounded-xl shadow-sm">
                             <span className="text-indigo-600 font-bold text-sm mr-2">Q{index + 1}.</span>
                             <span className="text-gray-800 font-medium">{q.questionText}</span>
                             <span className="ml-3 text-xs px-2 py-1 rounded bg-gray-100 text-gray-500">{q.difficulty}</span>
                           </div>
                         ))}
                       </div>
                    </div>
                  )}

                  {hw.status === 'Pending' ? (
                    <div className="space-y-4 border-t pt-6 mt-6">
                      <textarea rows="5" placeholder="Type your answers here..." value={answerText[hw._id] || ''} onChange={(e) => setAnswerText({...answerText, [hw._id]: e.target.value})} className="w-full p-5 bg-white border-2 border-gray-200 rounded-2xl outline-none resize-none font-medium"></textarea>
                      <button onClick={() => handleSubmit(hw._id)} className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
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