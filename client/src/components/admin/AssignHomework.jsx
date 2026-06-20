import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Target, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AssignHomework = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    studentId: '',
    qualification: 'GCSE Maths - Foundation',
    chapter: 'Algebra',
    topic: '',
    totalQuestions: 10,
    durationHours: 24
  });

  // Fetch students when component loads
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/admin/students');
        setStudents(res.data);
      } catch (error) {
        toast.error('Failed to load students');
      }
    };
    fetchStudents();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentId || !formData.topic) {
      return toast.error('Please select a student and enter a topic.');
    }

    setLoading(true);
    try {
      const res = await api.post('/admin/assign-homework', formData);
      toast.success(res.data.message);
      // Reset form slightly
      setFormData({ ...formData, topic: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error assigning homework');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-3xl"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Target className="text-indigo-600" /> Auto-Assign Adaptive Homework
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Student</label>
          <select name="studentId" value={formData.studentId} onChange={handleChange} required
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">-- Choose a Student --</option>
            {students.map(student => (
              <option key={student._id} value={student._id}>{student.name} ({student.email})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Filters */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Qualification</label>
            <select name="qualification" value={formData.qualification} onChange={handleChange}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="GCSE Maths - Foundation">GCSE Maths - Foundation</option>
              <option value="GCSE Maths - Higher">GCSE Maths - Higher</option>
              <option value="AS-Level Maths">AS-Level Maths</option>
              <option value="A-Level Maths">A-Level Maths</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Chapter</label>
            <select name="chapter" value={formData.chapter} onChange={handleChange}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="Algebra">Algebra</option>
              <option value="Geometry and measures">Geometry and measures</option>
              <option value="Number">Number</option>
              <option value="Probability">Probability</option>
              <option value="Statistics">Statistics</option>
            </select>
          </div>
        </div>

        {/* Topic Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Specific Topic (e.g., Linear Equations, Area of Circle)</label>
          <input type="text" name="topic" value={formData.topic} onChange={handleChange} required placeholder="Enter topic exactly as stored in DB"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Settings */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Total Questions</label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-3 text-gray-400" size={20} />
              <input type="number" name="totalQuestions" value={formData.totalQuestions} onChange={handleChange} min="1" max="50"
                className="w-full pl-10 pr-4 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Algorithm will mix Easy/Med/Hard based on student's past performance.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Time Limit (Hours)</label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input type="number" name="durationHours" value={formData.durationHours} onChange={handleChange} min="1"
                className="w-full pl-10 pr-4 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200 flex justify-center items-center gap-2">
          {loading ? 'Analyzing & Assigning...' : <><Send size={20} /> Assign Adaptive Homework</>}
        </button>
      </form>
    </motion.div>
  );
};

export default AssignHomework;