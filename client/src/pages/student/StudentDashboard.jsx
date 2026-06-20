import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, UploadCloud, LogOut, Clock } from 'lucide-react';
import api from '../../services/api';
import toast, { Toaster } from 'react-hot-toast';

const StudentDashboard = () => {
  const [homeworks, setHomeworks] = useState([]);
  const [answerText, setAnswerText] = useState({});

  useEffect(() => {
    fetchMyHomework();
  }, []);

  const fetchMyHomework = async () => {
    try {
      // Mocking response if backend isn't connected yet:
      const res = await api.get('/homework/student');
      setHomeworks(res.data);
    } catch (error) {
      console.log("Error loading homework", error);
    }
  };

  const handleSubmit = async (hwId) => {
    try {
      await api.post(`/homework/submit/${hwId}`, { answerText: answerText[hwId] });
      toast.success('Homework Submitted to Teacher!');
      fetchMyHomework(); // Refresh list
    } catch (error) {
      toast.error('Failed to submit');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-12">
      <Toaster />
      {/* Header */}
      <header className="bg-[#0f172a] text-white px-8 py-6 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">MathCom Mentors</h1>
          <p className="text-sm text-gray-400 mt-1">Student Portal</p>
        </div>
        <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
          <LogOut size={20} /> Logout
        </button>
      </header>

      <main className="max-w-5xl mx-auto mt-10 px-6">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-8">My Assignments</h2>

        <div className="grid grid-cols-1 gap-6">
          {homeworks.length === 0 && <p className="text-gray-500 text-center py-10">No pending assignments! Great job.</p>}

          {homeworks.map(hw => (
            <motion.div key={hw._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              
              {/* Header of Assignment Card */}
              <div className={`p-6 border-b flex justify-between items-center ${hw.status === 'Graded' ? 'bg-emerald-50 border-emerald-100' : 'bg-indigo-50 border-indigo-100'}`}>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{hw.title}</h3>
                  <p className="text-sm font-medium mt-1 text-gray-600 flex items-center gap-2">
                    <Clock size={16} /> Difficulty: {hw.difficulty}
                  </p>
                </div>
                
                {/* Status Badges */}
                {hw.status === 'Pending' && <span className="px-4 py-1.5 bg-yellow-100 text-yellow-800 font-bold text-sm rounded-full">To Do</span>}
                {hw.status === 'Submitted' && <span className="px-4 py-1.5 bg-blue-100 text-blue-800 font-bold text-sm rounded-full">Under Review</span>}
                {hw.status === 'Graded' && <span className="px-4 py-1.5 bg-emerald-100 text-emerald-800 font-bold text-sm rounded-full">Graded</span>}
              </div>

              {/* Body of Assignment Card */}
              <div className="p-6">
                {/* If Graded: Only show the score (as requested) */}
                {hw.status === 'Graded' ? (
                  <div className="text-center py-4">
                    <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-3" />
                    <h4 className="text-2xl font-black text-gray-800">Score: {hw.grading?.score}/100</h4>
                    <p className="text-gray-500 mt-2">Teacher Feedback: {hw.grading?.feedback || 'Great work!'}</p>
                  </div>
                ) : (
                  /* If Pending or Submitted: Show description and input box */
                  <>
                    <div className="mb-6">
                      <p className="text-gray-700 font-medium whitespace-pre-wrap">{hw.description}</p>
                    </div>

                    {hw.status === 'Pending' ? (
                      <div className="space-y-4">
                        <textarea 
                          rows="4" 
                          placeholder="Type your answers here..." 
                          value={answerText[hw._id] || ''}
                          onChange={(e) => setAnswerText({...answerText, [hw._id]: e.target.value})}
                          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 outline-none resize-none"
                        ></textarea>
                        <button 
                          onClick={() => handleSubmit(hw._id)}
                          className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2"
                        >
                          <UploadCloud size={20} /> Submit Work
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-sm font-semibold text-gray-500 mb-1">Your Submission:</p>
                        <p className="text-gray-800">{hw.submission?.answerText}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;