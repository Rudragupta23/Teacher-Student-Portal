import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function StudentDashboard() {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    const res = await api.get('/homework/student');
    setAssignments(res.data);
  };

  const handleSubmit = async (hwId, dueDate) => {
    if (new Date() > new Date(dueDate)) {
      alert("❌ You are late! The deadline has passed. Please contact your teacher to extend the duration.");
      return;
    }

    const answerUrl = prompt('Enter URL of your uploaded work (PDF/Image):');
    if (!answerUrl) return;

    try {
      await api.post(`/homework/${hwId}/submit`, { answerFileUrl: answerUrl });
      alert('🎉 Homework submitted successfully!');
      fetchAssignments();
    } catch (err) {
      alert(err.response?.data?.message || 'Submission failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-2">My Student Portal</h1>
        <p className="text-slate-500">Track your assignments and grades below.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {assignments.map(hw => {
          const isLate = new Date() > new Date(hw.dueDate);
          const isPending = hw.status === 'Pending';
          
          return (
            <div key={hw._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase 
                    ${hw.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700' : 
                      hw.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                    {hw.difficulty}
                  </span>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-lg border ${hw.status === 'Graded' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {hw.status}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{hw.title}</h3>
                <p className="text-sm text-slate-500 mb-4">{hw.type} Format • {hw.questions?.length || 0} Questions</p>
                
                {hw.fileUrl && (
                  <a href={hw.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-indigo-500 hover:underline font-medium block mb-4">
                    📎 View Assignment Attachment
                  </a>
                )}

                <div className={`p-3 rounded-xl mb-4 ${isLate && isPending ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-600'}`}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1">Due Date</p>
                  <p className="text-sm font-medium">{new Date(hw.dueDate).toLocaleString()}</p>
                  {isLate && isPending && <p className="text-xs mt-1 font-bold animate-pulse">⚠️ Time Over!</p>}
                </div>
              </div>

              {/* Action Buttons based on status */}
              <div className="mt-4 border-t pt-4">
                {isPending && (
                  <button 
                    onClick={() => handleSubmit(hw._id, hw.dueDate)}
                    className={`w-full py-3 rounded-xl font-bold transition-all shadow-md
                      ${isLate 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:-translate-y-1'}`}
                  >
                    {isLate ? 'Submit (Late)' : 'Submit Homework'}
                  </button>
                )}

                {hw.status === 'Graded' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg border border-green-100">
                      <span className="text-green-800 font-medium">Your Score:</span>
                      <span className="text-xl font-black text-green-600">{hw.grading.score}</span>
                    </div>
                    {hw.grading.adminAnswerSheetUrl && (
                      <a href={hw.grading.adminAnswerSheetUrl} target="_blank" rel="noreferrer" 
                        className="block w-full text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors">
                        📄 View Admin Answer Sheet
                      </a>
                    )}
                  </div>
                )}

                {hw.status === 'Submitted' && (
                  <p className="text-center text-sm font-medium text-amber-500 p-2 bg-amber-50 rounded-lg">
                    Under Review by Teacher
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}