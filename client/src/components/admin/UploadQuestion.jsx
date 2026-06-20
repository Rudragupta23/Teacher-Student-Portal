import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, PlusCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const UploadQuestion = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    qualification: 'GCSE Maths - Foundation',
    chapter: 'Algebra',
    topic: '',
    difficulty: 'easy',
    type: 'mcq',
    content: '',
    correctAnswer: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/admin/questions', formData);
      toast.success(res.data.message);
      // Clear the content fields but keep the categories so the teacher can upload rapidly
      setFormData({ ...formData, content: '', correctAnswer: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload question');
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
        <Database className="text-indigo-600" /> Add to Question Bank
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Categorization */}
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
              <option value="Geometry and measures">Geometry</option>
              <option value="Number">Number</option>
              <option value="Probability">Probability</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Topic Name</label>
            <input type="text" name="topic" value={formData.topic} onChange={handleChange} required placeholder="e.g., Linear Eq"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Question Settings */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
            <select name="difficulty" value={formData.difficulty} onChange={handleChange}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Question Type</label>
            <select name="type" value={formData.type} onChange={handleChange}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="mcq">Multiple Choice (Auto-graded)</option>
              <option value="text">Short Text (Auto-graded)</option>
              <option value="file">File Upload (Manual review)</option>
            </select>
          </div>
        </div>

        {/* Content & Answer */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Question Content (Text or Image URL)</label>
          <textarea name="content" value={formData.content} onChange={handleChange} required rows="3" placeholder="Type the question here..."
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
        </div>

        {formData.type !== 'file' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Correct Answer (For Auto-grading)</label>
            <input type="text" name="correctAnswer" value={formData.correctAnswer} onChange={handleChange} required placeholder="e.g., Option A, or 'x = 5'"
              className="w-full p-3 bg-gray-50 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" />
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200 flex justify-center items-center gap-2">
          {loading ? 'Saving...' : <><PlusCircle size={20} /> Add Question</>}
        </button>
      </form>
    </motion.div>
  );
};

export default UploadQuestion;