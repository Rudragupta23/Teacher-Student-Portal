import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import html2canvas from 'html2canvas';

export default function AdminDashboard() {
  // Navigation & Data State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [homeworks, setHomeworks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [minDateTime, setMinDateTime] = useState('');
  const [selectedStudentForChart, setSelectedStudentForChart] = useState('all');
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({ content: '', targetAudience: 'all', imageUrl: '' });
  const [isAnnounceUploading, setIsAnnounceUploading] = useState(false);

  // Form State
  const [assignForm, setAssignForm] = useState({
    title: '', type: 'File', studentId: 'all', difficulty: 'Medium', 
    dueDate: '', fileUrl: '', content: '', 
    mcqs: [{ question: '', options: ['', '', '', ''], correctOption: 0 }]
  });
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // State for optional answer sheet upload
  const [answerSheet, setAnswerSheet] = useState({ fileUrl: '', fileName: '', isUploading: false });

  // Custom UI States
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [modal, setModal] = useState({ type: null, hwId: null, studentId: null, data: '' }); 
  const [isLoading, setIsLoading] = useState(true); 

  // Admin Profile & Settings State
  const [adminProfile, setAdminProfile] = useState({ name: 'Mentor', profilePic: '' });
  const [settingsForm, setSettingsForm] = useState({ name: '', profilePic: '', studentToDelete: '' });
  const [isProfileUploading, setIsProfileUploading] = useState(false);
  const [userId, setUserId] = useState(null); // 🌟 ADDED USER ID STATE

  // Chat States
  const [messages, setMessages] = useState([]);
  const [selectedStudentForChat, setSelectedStudentForChat] = useState(null);
  const [chatInput, setChatInput] = useState('');

  // Study Library States
  const [resources, setResources] = useState([]);
  const [resourceForm, setResourceForm] = useState({ title: '', description: '', type: 'Document', url: '' });
  const [isResourceUploading, setIsResourceUploading] = useState(false);

  useEffect(() => {
    fetchData();
    
    fetchProfile(); 

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setMinDateTime(now.toISOString().slice(0, 16));
    
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserId(payload.id);
      } catch (e) {
        console.error("Could not parse token");
      }
    }
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true); 
    try {
      const res = await api.get('/auth/profile');
      setAdminProfile({ name: res.data.name, profilePic: res.data.profilePic || '' });
      setSettingsForm(prev => ({ ...prev, name: res.data.name, profilePic: res.data.profilePic || '' }));
    } catch (error) {
      console.error("Error fetching profile from DB");
    } finally {
      setIsLoading(false); 
    }
  };

  const fetchData = async () => {
    try {
      const [studentRes, hwRes, annRes, resRes] = await Promise.all([
        api.get('/admin/students'),
        api.get('/homework/admin'),
        api.get('/announcements/admin'),
        api.get('/resources') 
      ]);
      setStudents(studentRes.data);
      setHomeworks(hwRes.data);
      setAnnouncements(annRes.data);
      setResources(resRes.data); 
    } catch (error) {
      showToast("Error fetching dashboard data.", "error");
    }
  };

  const handleResourceFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) return showToast("File too large (Max 5MB)", "error");
      setIsResourceUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setResourceForm({ ...resourceForm, url: reader.result });
        setIsResourceUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    if (!resourceForm.url) return showToast("Please provide a file or link", "error");
    try {
      await api.post('/resources', resourceForm);
      showToast("Library Resource Added!");
      setResourceForm({ title: '', description: '', type: 'Document', url: '' });
      fetchData();
    } catch (err) { showToast("Failed to upload resource", "error"); }
  };

  const handleDeleteResource = async (id) => {
    try {
      await api.delete(`/resources/${id}`);
      showToast("Resource deleted", "error");
      fetchData();
    } catch(e) { showToast("Failed to delete", "error"); }
  };

  const handleAnnounceImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) return showToast("Image too large (Max 5MB)", "error");
      setIsAnnounceUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnnouncementForm({ ...announcementForm, imageUrl: reader.result });
        setIsAnnounceUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (!announcementForm.content) return showToast("Message content is required", "error");
    try {
      await api.post('/announcements', announcementForm);
      showToast("📢 Announcement Broadcasted Successfully!");
      setAnnouncementForm({ content: '', targetAudience: 'all', imageUrl: '' });
      fetchData();
    } catch (err) {
      showToast("Failed to post announcement", "error");
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await api.delete(`/announcements/${id}`);
      showToast("Announcement deleted", "error");
      fetchData();
    } catch(e) {
      showToast("Failed to delete", "error");
    }
  };
  const fetchMessages = async (studentId) => {
    try {
      const res = await api.get(`/messages/${studentId}`);
      setMessages(res.data);
    } catch (e) { console.error("Error fetching messages"); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedStudentForChat) return;
    try {
      await api.post('/messages', { receiverId: selectedStudentForChat._id, content: chatInput });
      setChatInput('');
      fetchMessages(selectedStudentForChat._id); 
    } catch (e) { showToast("Failed to send message", "error"); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    window.location.href = '/'; 
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) { 
        showToast("File is too large! Please keep it under 5MB.", "error");
        return;
      }
      setFileName(file.name);
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAssignForm({ ...assignForm, fileUrl: reader.result });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnswerSheetUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) return showToast("File is too large! Please keep it under 5MB.", "error");
      setAnswerSheet({ ...answerSheet, fileName: file.name, isUploading: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setAnswerSheet({ ...answerSheet, fileUrl: reader.result, fileName: file.name, isUploading: false });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.dueDate) return showToast("Please assign a valid Due Date!", "error");

    try {
      await api.post('/homework/assign', assignForm);
      showToast('🎉 Assignment successfully published!');
      fetchData(); 
      setAssignForm({ ...assignForm, title: '', fileUrl: '', content: '', mcqs: [{ question: '', options: ['', '', '', ''], correctOption: 0 }] });
      setFileName('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Error assigning work.', "error");
    }
  };

  const addMcq = () => setAssignForm({ ...assignForm, mcqs: [...assignForm.mcqs, { question: '', options: ['', '', '', ''], correctOption: 0 }] });
  const updateMcq = (index, field, value, optionIndex = null) => {
    const updatedMcqs = [...assignForm.mcqs];
    if (field === 'options') updatedMcqs[index].options[optionIndex] = value;
    else updatedMcqs[index][field] = value;
    setAssignForm({ ...assignForm, mcqs: updatedMcqs });
  };

  const executeModalAction = async () => {
    try {
      if (modal.type === 'grade') {
        const hasScores = modal.data.score !== '' && modal.data.totalScore !== '';
        if (!hasScores && !answerSheet.fileUrl) {
          return showToast("Enter marks or attach marked work!", "error");
        }
        
        await api.put(`/homework/${modal.hwId}/grade`, { 
          score: modal.data.score !== '' ? Number(modal.data.score) : null, 
          totalScore: modal.data.totalScore !== '' ? Number(modal.data.totalScore) : null, 
          adminAnswerSheetUrl: answerSheet.fileUrl 
        });
        
        showToast("Assignment Graded/Updated Successfully!");
      } 
      else if (modal.type === 'extend') {
        if (!modal.data) return showToast("Select a valid date!", "error");
        await api.put(`/homework/${modal.hwId}/extend`, { newDueDate: modal.data });
        showToast("Deadline Extended!");
      } 
      else if (modal.type === 'delete') {
        await api.delete(`/homework/${modal.hwId}`);
        showToast("Assignment Deleted.", "error"); 
      }
      else if (modal.type === 'deleteStudent') {
        await api.delete(`/admin/students/${modal.studentId}`);
        showToast("Student Removed Successfully.", "error");
      }
      else if (modal.type === 'deleteAnsSheet') {
        await api.put(`/homework/${modal.hwId}/grade`, { 
          score: modal.data.score != null ? Number(modal.data.score) : null, 
          totalScore: modal.data.totalScore != null ? Number(modal.data.totalScore) : null,
          adminAnswerSheetUrl: '' 
        });
        showToast("Marked Work Removed!");
      }
      
      setModal({ type: null, hwId: null, studentId: null, data: '' });
      setAnswerSheet({ fileUrl: '', fileName: '', isUploading: false }); 
      fetchData();
    } catch (error) {
      showToast(error.response?.data?.message || "Action failed.", "error");
    }
  };

  const filteredHomeworks = homeworks.filter(hw => 
    hw.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    hw.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProfilePicUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) return showToast("Profile picture must be under 2MB", "error");
      setIsProfileUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsForm(prev => ({ ...prev, profilePic: reader.result }));
        setIsProfileUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await api.put('/auth/profile', { name: settingsForm.name, profilePic: settingsForm.profilePic });
      setAdminProfile({ name: res.data.user.name, profilePic: res.data.user.profilePic || '' });
      showToast("Profile Settings Saved to Database!");
    } catch (error) {
      showToast("Failed to save profile", "error");
    }
  };
  
  const handleExportCSV = () => {
    if (students.length === 0) return showToast("No students to export", "error");

    const headers = ["Student Name", "Email", "Completed Tasks", "Pending Review", "Average Score (%)"];
    
    const rows = students.map(student => {
      const studentHw = homeworks.filter(h => h.studentId?._id === student._id);
      const completedCount = studentHw.filter(h => h.status === 'Graded').length;
      const pendingCount = studentHw.filter(h => h.status === 'Submitted').length;
      
      const gradedHw = studentHw.filter(h => h.status === 'Graded');
      // const avgScore = gradedHw.length > 0 ? (gradedHw.reduce((acc, curr) => acc + (curr.grading?.score || 0), 0) / gradedHw.length).toFixed(1) : 0;
      let totalEarned = 0; let totalPossible = 0;
      gradedHw.forEach(h => {
      if(h.grading?.score != null && h.grading?.totalScore) {
      totalEarned += h.grading.score;
      totalPossible += h.grading.totalScore;
    }
  });
      const avgScore = totalPossible > 0 ? ((totalEarned / totalPossible) * 100).toFixed(1) : "0.0";

      return `"${student.name}","${student.email}",${completedCount},${pendingCount},${avgScore}`;
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `Student_Grades_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Grades successfully exported to CSV!");
  };
  const handleExportPDF = async () => { 
    if (students.length === 0) return showToast("No students to export", "error");

    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text("Student Performance Report", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      const tableColumn = ["Student Name", "Email", "Completed Tasks", "Pending Review", "Avg Score (%)"];
      const tableRows = [];

      students.forEach(student => {
        const studentHw = homeworks.filter(h => h.studentId?._id === student._id);
        const completedCount = studentHw.filter(h => h.status === 'Graded').length;
        const pendingCount = studentHw.filter(h => h.status === 'Submitted').length;
        
        const gradedHw = studentHw.filter(h => h.status === 'Graded');
        let totalEarned = 0; let totalPossible = 0;
gradedHw.forEach(h => {
  if(h.grading?.score != null && h.grading?.totalScore) {
      totalEarned += h.grading.score;
      totalPossible += h.grading.totalScore;
  }
});
const avgScore = totalPossible > 0 ? ((totalEarned / totalPossible) * 100).toFixed(1) : "0.0";

        tableRows.push([student.name, student.email, completedCount.toString(), pendingCount.toString(), `${avgScore}%`]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
      });

      const chartContainer = document.getElementById('analytics-export-area');
      
      if (chartContainer) {
        doc.addPage();
        doc.setFontSize(18);
        doc.setTextColor(27, 37, 89);
        doc.text("Visual Analytics", 14, 22);

        const canvas = await html2canvas(chartContainer, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        
        const pdfWidth = 190; 
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', 10, 30, pdfWidth, pdfHeight);
      }

      doc.save(`Student_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast(chartContainer ? "Grades & Charts successfully exported!" : "Grades exported! (Go to Analytics tab to include charts)");
    } catch (error) {
      console.error("PDF Export Error:", error);
      showToast("Error generating PDF. Check console.", "error");
    }
  };

  const chartData = Object.values(homeworks.reduce((acc, hw) => {
    if (hw.status === 'Graded' && hw.grading?.score != null && hw.grading?.totalScore) {
      if (!acc[hw.title]) {
        acc[hw.title] = { title: hw.title, totalEarned: 0, totalPossible: 0 };
      }
      acc[hw.title].totalEarned += hw.grading.score;
      acc[hw.title].totalPossible += hw.grading.totalScore;
    }
    return acc;
  }, {})).map(item => ({
    name: item.title.length > 15 ? item.title.substring(0, 15) + '...' : item.title,
    avgScore: Number(((item.totalEarned / item.totalPossible) * 100).toFixed(1))
  }));

    return (
      <div className="flex h-screen bg-[#F4F7FE] font-sans overflow-hidden text-slate-800 relative">
        
        <div className={`absolute top-6 right-6 z-50 transform transition-all duration-500 ease-out flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-white
          ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          ${toast.type === 'error' ? 'bg-rose-500' : 'bg-slate-900'}`}>
          {toast.type === 'error' ? '⚠️' : '✅'}
          {toast.message}
        </div>

      {modal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl transform scale-100 animate-slide-up">
            
            {modal.type === 'grade' && (
              <>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Grade Assignment</h3>
                <p className="text-slate-500 text-sm mb-6">Enter score and total marks (Optional if attaching file).</p>
                <div className="flex gap-4 mb-6">
                  <input type="number" min="0" className="w-1/2 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-black text-2xl text-center" 
                    value={modal.data?.score || ''} onChange={e => setModal({...modal, data: { ...modal.data, score: e.target.value }})} placeholder="Score (e.g. 7)" />
                  <span className="text-3xl font-black text-slate-400 self-center">/</span>
                  <input type="number" min="0" className="w-1/2 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-black text-2xl text-center" 
                    value={modal.data?.totalScore || ''} onChange={e => setModal({...modal, data: { ...modal.data, totalScore: e.target.value }})} placeholder="Total (e.g. 10)" />
                </div>
                  
                <p className="text-slate-500 text-sm mb-2 font-bold">Attach Marked/Checked work (Optional)</p>
                <div className="relative border-2 border-dashed border-slate-300 bg-slate-50 rounded-2xl p-4 text-center hover:bg-slate-100 transition-colors cursor-pointer mb-6 group">
                  <input type="file" accept=".pdf, image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleAnswerSheetUpload} />
                  <p className="font-bold text-slate-600 text-sm">{answerSheet.fileName ? `📎 ${answerSheet.fileName}` : 'Click to upload PDF/Image'}</p>
                  {answerSheet.isUploading && <p className="text-xs text-amber-500 mt-1">Uploading...</p>}
                </div>
              </>
            )}

            {modal.type === 'extend' && (
              <>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Extend Deadline 📅</h3>
                <p className="text-slate-500 text-sm mb-6">Select the new due date and time for this assignment.</p>
                <input type="datetime-local" min={minDateTime} className="w-full p-4 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold mb-6" 
                  value={modal.data} onChange={e => setModal({...modal, data: e.target.value})} />
              </>
            )}

            {(modal.type === 'delete' || modal.type === 'deleteStudent' || modal.type === 'deleteAnsSheet') && (
              <>
                <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-4 text-3xl mx-auto">🗑️</div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 text-center">
                  {modal.type === 'deleteStudent' ? 'Remove Student?' : modal.type === 'deleteAnsSheet' ? 'Delete Marked/Checked work?' : 'Delete Assignment?'}
                </h3>
                <p className="text-slate-500 text-sm mb-6 text-center">
                  {modal.type === 'deleteAnsSheet' ? 'This will remove your uploaded marked/checked work from this graded assignment.' : 'This action is permanent and cannot be undone.'}
                </p>
              </>
            )}

            {modal.type === 'viewWork' && (
              <>
                <h3 className="text-2xl font-black text-[#1B2559] mb-4 text-left border-b border-slate-100 pb-4">Student's Submission</h3>

                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 mb-6 text-left space-y-4">
                  {modal.data.answerText && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <h4 className="text-xs font-black text-[#A3AED0] uppercase tracking-wide mb-2">Written Answer</h4>
                      <p className="text-slate-700 whitespace-pre-wrap font-medium">{modal.data.answerText}</p>
                    </div>
                  )}

                  {modal.data.answerFileUrl && (
                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs font-black text-[#A3AED0] uppercase tracking-wide mt-2">Attached File Preview</h4>
                      
                      <div className="w-full max-h-[400px] overflow-auto border-2 border-slate-200 rounded-2xl bg-[#F4F7FE] p-2 shadow-inner">
                        {modal.data.answerFileUrl.startsWith('data:image') ? (
                          <img src={modal.data.answerFileUrl} alt="Submission" className="w-full h-auto rounded-xl object-contain" />
                        ) : modal.data.answerFileUrl.startsWith('data:application/pdf') ? (
                          <embed src={modal.data.answerFileUrl} type="application/pdf" className="w-full h-[380px] rounded-xl" />
                        ) : (
                          <p className="text-center text-slate-500 py-10 font-bold">Preview not available for this format.</p>
                        )}
                      </div>

                      <button type="button" onClick={() => {
                          const a = document.createElement('a');
                          a.href = modal.data.answerFileUrl;
                          a.download = `${(modal.title || 'Student_Submission').replace(/\s+/g, '_')}_Attachment`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }}
                        className="w-full mt-2 px-6 py-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 font-black rounded-2xl transition-all border-2 border-dashed border-indigo-200 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Download Full File
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex gap-4">
              {modal.type === 'viewWork' ? (
                <button onClick={() => setModal({ type: null, hwId: null, studentId: null, data: '' })} className="w-full py-4 bg-slate-100 text-slate-700 hover:bg-slate-200 font-black rounded-2xl transition-colors">
                  Close Preview
                </button>
              ) : (
                <>
                  <button onClick={() => { setModal({ type: null, hwId: null, studentId: null, data: '' }); setAnswerSheet({ fileUrl: '', fileName: '', isUploading: false }); }} className="flex-1 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold rounded-2xl transition-colors">
                    Cancel
                  </button>
                  <button onClick={executeModalAction} className={`flex-1 py-4 font-bold rounded-2xl text-white transition-transform hover:-translate-y-1 shadow-lg
                    ${(modal.type === 'delete' || modal.type === 'deleteStudent' || modal.type === 'deleteAnsSheet') ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30' : 
                      modal.type === 'grade' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 
                      'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'}`}>
                    {(modal.type === 'delete' || modal.type === 'deleteStudent' || modal.type === 'deleteAnsSheet') ? 'Yes, Delete' : 'Confirm'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0B1437] text-slate-300 flex flex-col shadow-2xl z-20 hidden lg:flex rounded-r-[2rem] my-4 ml-4 overflow-hidden">
        
        {/* 1. Header */}
        <div className="p-8 flex items-center gap-4 border-b border-slate-700/50 shrink-0">
          {adminProfile?.profilePic ? (
            <img src={adminProfile.profilePic} alt="Profile" className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-indigo-500/30" />
          ) : (
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 text-white w-12 h-12 flex items-center justify-center rounded-2xl font-black text-2xl shadow-lg shadow-indigo-500/30">
              M
            </div>
          )}
          <div>
            <h1 className="text-lg font-black text-white tracking-wide leading-tight">MathCom<br/>Mentor</h1>
            <p className="text-xs font-bold text-indigo-300 mt-1.5 tracking-widest uppercase bg-slate-800/80 inline-block px-2 py-1 rounded-md border border-slate-700">
              Code: MATH_2026
            </p>
          </div>
        </div>
        
        {/* 2. Navigation Links */}
        <div className="relative flex-1 flex flex-col overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#0B1437] to-transparent pointer-events-none z-10"></div>
          
          <div className="p-6 space-y-3 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            Create Assignment 
          </button>

          <button onClick={() => setActiveTab('students')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'students' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            Students Enrolled
          </button>

          <button onClick={() => setActiveTab('announcements')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'announcements' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
            Announcements
          </button>

          <button onClick={() => setActiveTab('library')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'library' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            Study Materials
          </button>

          <button onClick={() => setActiveTab('messages')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'messages' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            Direct Messages
          </button>

          <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Analytics
          </button>

          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Settings
          </button>
        </div>
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0B1437] to-transparent pointer-events-none z-10 flex items-end justify-center pb-1">
            <svg className="w-5 h-5 text-slate-500/60 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
        
        {/* 3. Sign Out */}
        <div className="p-6 border-t border-slate-700/50 shrink-0">
          <button onClick={handleLogout} className="w-full flex justify-center items-center gap-2 bg-slate-800 hover:bg-rose-500 text-slate-300 hover:text-white px-5 py-4 rounded-2xl font-bold transition-all shadow-sm group">
            <svg className="w-5 h-5 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto scroll-smooth p-6 lg:p-10">
        <div className="max-w-[1600px] mx-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
            <div>
              <h1 className="text-4xl font-black text-[#1B2559]">Welcome back, {adminProfile.name} 👋</h1>
              <p className="text-[#A3AED0] mt-2 font-bold tracking-wide">Here is what is happening in your classes today.</p>
            </div>
            
            <div className="flex gap-4 mt-6 md:mt-0">
              <div className="bg-white px-6 py-4 rounded-3xl shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4">
                <div className="bg-indigo-50 p-3 rounded-full text-indigo-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                </div>
                <div>
                  <p className="text-xs font-black text-[#A3AED0] uppercase tracking-wider">Total Students</p>
                  <p className="text-2xl font-black text-[#1B2559]">{students.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* VIEW 1: DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in">
              
              <div className="xl:col-span-5 bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] h-fit">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-indigo-600 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#1B2559]">Create Task</h2>
                </div>
                
                <form onSubmit={handleAssignSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Task Title</label>
                    <input className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/20 text-[#1B2559] outline-none transition-all font-bold" 
                      placeholder="e.g., Advanced Calculus Chapter 2" required value={assignForm.title}
                      onChange={e => setAssignForm({...assignForm, title: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Assign To</label>
                      <select className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]" 
                        onChange={e => setAssignForm({...assignForm, studentId: e.target.value})}>
                        <option value="all">All Students</option>
                        {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Difficulty</label>
                      <select className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]" 
                        onChange={e => setAssignForm({...assignForm, difficulty: e.target.value})}>
                        <option value="Easy">Easy 🟢</option>
                        <option value="Medium">Medium 🟡</option>
                        <option value="Hard">Hard 🔴</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-indigo-500 uppercase tracking-wide ml-1">Deadline Date & Time</label>
                    <input type="datetime-local" required min={minDateTime}
                      className="w-full p-4 bg-indigo-50 border-none text-indigo-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-black cursor-pointer" 
                      value={assignForm.dueDate}
                      onChange={e => setAssignForm({...assignForm, dueDate: e.target.value})} />
                  </div>

                  <div className="space-y-1 pt-4 border-t border-slate-100">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Format Type</label>
                    <select className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl font-bold text-[#1B2559] outline-none mb-4 cursor-pointer" 
                      value={assignForm.type} onChange={e => setAssignForm({...assignForm, type: e.target.value})}>
                      <option value="File">Upload File (PDF/Image)</option>
                      <option value="Text">Write Question</option>
                      <option value="MCQ">Build Quiz (MCQ)</option>
                    </select>

                    <div className="animate-fade-in">
                      {assignForm.type === 'File' && (
                        <div className="relative border-2 border-dashed border-indigo-300 bg-[#F4F7FE] rounded-3xl p-10 text-center hover:bg-indigo-50 transition-colors cursor-pointer group">
                          <input type="file" accept=".pdf, image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileUpload} />
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform text-3xl">📁</div>
                          <p className="font-black text-[#1B2559]">Drag & Drop or Click</p>
                          <p className="text-xs font-bold text-[#A3AED0] mt-1">PDF, JPG, PNG up to 5MB</p>
                          {isUploading && <p className="mt-3 text-sm font-bold text-amber-500">Processing file...</p>}
                          {fileName && !isUploading && <p className="mt-3 inline-block bg-white text-indigo-800 px-4 py-2 rounded-full text-xs font-bold shadow-sm">{fileName}</p>}
                        </div>
                      )}

                      {assignForm.type === 'Text' && (
                        <textarea className="w-full p-5 bg-[#F4F7FE] border-none rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-[#1B2559] font-medium min-h-[160px]" 
                          placeholder="Type instructions or complete text here..." 
                          value={assignForm.content} onChange={e => setAssignForm({...assignForm, content: e.target.value})} />
                      )}

                      {assignForm.type === 'MCQ' && (
                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                          {assignForm.mcqs.map((mcq, qIndex) => (
                            <div key={qIndex} className="p-5 bg-[#F4F7FE] rounded-3xl">
                              <input className="w-full p-2 mb-3 font-black border-b-2 border-slate-200 bg-transparent outline-none focus:border-indigo-500 text-[#1B2559]" 
                                placeholder={`Question ${qIndex + 1}`} value={mcq.question} 
                                onChange={(e) => updateMcq(qIndex, 'question', e.target.value)} />
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                {mcq.options.map((opt, oIndex) => (
                                  <input key={oIndex} className="p-3 text-sm border-none rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-400 font-bold" 
                                    placeholder={`Option ${oIndex + 1}`} value={opt} 
                                    onChange={(e) => updateMcq(qIndex, 'options', e.target.value, oIndex)} />
                                ))}
                              </div>
                              <div className="flex items-center gap-3">
                                <label className="text-xs font-black text-[#A3AED0] uppercase">Correct Answer:</label>
                                <select className="p-2 text-sm font-black border-none rounded-xl bg-emerald-100 text-emerald-800 outline-none" 
                                  value={mcq.correctOption} onChange={(e) => updateMcq(qIndex, 'correctOption', parseInt(e.target.value))}>
                                  <option value={0}>Option 1</option><option value={1}>Option 2</option><option value={2}>Option 3</option><option value={3}>Option 4</option>
                                </select>
                              </div>
                            </div>
                          ))}
                          <button type="button" onClick={addMcq} className="w-full py-4 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-3xl font-black hover:bg-indigo-50 transition-colors">
                            + Add Next Question
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button className="w-full bg-[#1B2559] hover:bg-indigo-600 text-white font-black py-5 rounded-2xl transition-all shadow-[0_18px_40px_rgba(112,144,176,0.2)] text-lg flex items-center justify-center gap-2 transform hover:-translate-y-1">
                    Publish Assignments
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </button>
                </form>
              </div>

              {/* TRACKER BOARD */}
              <div className="xl:col-span-7 bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex flex-col h-fit md:min-h-[800px]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 w-2 h-8 rounded-full"></div>
                    <h2 className="text-2xl font-black text-[#1B2559]">Submissions Board</h2>
                  </div>
                  <div className="relative w-full md:w-72">
                    <svg className="w-5 h-5 absolute left-4 top-4 text-[#A3AED0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input type="text" placeholder="Search tasks..." 
                      className="w-full py-3 pl-12 pr-4 bg-[#F4F7FE] rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-[#1B2559]"
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
                
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {filteredHomeworks.map(hw => {
                    const isLate = new Date() > new Date(hw.dueDate);

                    return (
                      <div key={hw._id} className="p-6 bg-white border border-slate-100 hover:bg-[#F4F7FE]/50 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 transition-all hover:shadow-lg group">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-black text-xl text-[#1B2559]">{hw.title}</h3>
                            <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider
                              ${hw.status === 'Pending' ? 'bg-slate-100 text-slate-500' : 
                                hw.status === 'Submitted' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                              {hw.status}
                            </span>
                          </div>
                          
                          <p className="text-sm text-[#A3AED0] font-bold mb-4">Assigned to: <span className="font-black text-[#1B2559]">{hw.studentId?.name || "Deleted User"}</span></p>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-[#F4F7FE] text-[#A3AED0] px-3 py-1.5 rounded-xl text-xs font-black">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                              {new Date(hw.dueDate).toLocaleString()}
                            </div>
                            {isLate && hw.status === 'Pending' && <span className="bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-xs font-black">Overdue</span>}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                          {hw.status === 'Pending' && (
                            <button onClick={() => setModal({ type: 'extend', hwId: hw._id, data: '' })} className="px-5 py-3 bg-white border border-indigo-200 text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm text-sm">
                              + Extend Date
                            </button>
                          )}
                          
                          {hw.status === 'Submitted' && (
                            <>
                              {/* 🌟 Triggers the inline preview modal instead of new tab */}
                              {hw.submission && (hw.submission.answerFileUrl || hw.submission.answerText) && (
                                <button onClick={() => setModal({ type: 'viewWork', hwId: hw._id, data: hw.submission, title: hw.title })} className="px-5 py-3 bg-[#1B2559] text-white font-black rounded-2xl hover:bg-indigo-900 transition-colors shadow-md text-sm">
                                  View Work
                                </button>
                              )}
                              <button onClick={() => setModal({ type: 'grade', hwId: hw._id, data: { score: '', totalScore: '' } })} className="px-5 py-3 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 transition-transform hover:-translate-y-1 shadow-md text-sm flex items-center gap-2">
                                Grade
                              </button>
                            </>
                          )}
                          
                          {hw.status === 'Graded' && (
                            <div className="flex items-center gap-2">
                              {/* Editable Score Button - Click to update grade or add score later! */}
                              <button 
                                onClick={() => {
                                  setModal({ type: 'grade', hwId: hw._id, data: { score: hw.grading?.score ?? '', totalScore: hw.grading?.totalScore ?? '' } });
                                  if (hw.grading?.adminAnswerSheetUrl) {
                                    setAnswerSheet({ fileUrl: hw.grading.adminAnswerSheetUrl, fileName: 'Existing Marked/Checked work Attached', isUploading: false });
                                  } else {
                                    setAnswerSheet({ fileUrl: '', fileName: '', isUploading: false });
                                  }
                                }}
                                className="px-6 py-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-2xl font-black border border-emerald-200 text-lg transition-colors shadow-sm"
                                title="Edit Grade or Marked Work"
                              >
                                {hw.grading?.score != null ? `${hw.grading.score}/${hw.grading.totalScore} ✏️` : '➕ Add Score'}
                              </button>
                              
                              {hw.grading?.adminAnswerSheetUrl && (
                                <button onClick={() => setModal({ type: 'deleteAnsSheet', hwId: hw._id, data: { score: hw.grading.score, totalScore: hw.grading.totalScore } })} className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-colors shadow-sm text-sm font-bold" title="Delete Marked Work">
                                  Remove Marked Work
                                </button>
                              )}
                            </div>
                          )}

                          <button onClick={() => setModal({ type: 'delete', hwId: hw._id, data: '' })} className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-colors shadow-sm ml-2 text-xl" title="Delete">
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredHomeworks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                      <div className="text-6xl mb-6 opacity-50">📂</div>
                      <p className="text-[#1B2559] font-black text-xl mb-1">Inbox Zero!</p>
                      <p className="text-[#A3AED0] font-bold">Assign new work on the left side to get started.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: STUDENT LIST TAB */}
          {activeTab === 'students' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#1B2559]">Enrolled Students </h2>
                </div>
                
                <div className="flex items-center gap-3">
                  <button onClick={handleExportCSV} className="px-5 py-3 bg-slate-50 text-slate-700 hover:bg-slate-700 hover:text-white font-black rounded-xl transition-colors shadow-sm flex items-center gap-2 border border-slate-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Export CSV
                  </button>
                  <button onClick={handleExportPDF} className="px-5 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white font-black rounded-xl transition-colors shadow-sm flex items-center gap-2 border border-indigo-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Export PDF
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {students.map(student => {
                  const studentHw = homeworks.filter(h => h.studentId?._id === student._id);
                  const completedCount = studentHw.filter(h => h.status === 'Graded').length;
                  const pendingCount = studentHw.filter(h => h.status === 'Submitted').length;

                  const gradedHw = studentHw.filter(h => h.status === 'Graded');
                  let totalEarned = 0; let totalPossible = 0;
gradedHw.forEach(h => {
  if(h.grading?.score != null && h.grading?.totalScore) {
      totalEarned += h.grading.score;
      totalPossible += h.grading.totalScore;
  }
});
const avgScore = totalPossible > 0 ? ((totalEarned / totalPossible) * 100).toFixed(1) : "0.0";
                  const progressWidth = `${avgScore}%`;

                  return (
                    <div key={student._id} className="bg-[#F4F7FE] p-6 rounded-3xl flex flex-col gap-4 hover:shadow-lg transition-shadow border border-transparent hover:border-indigo-100">
                      
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-md">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-black text-[#1B2559] text-xl">
                              {student.registrationName || student.name}
                            </h3>
                            {student.yearGroup && <span className="bg-indigo-100 text-indigo-700 text-xs font-black px-2 py-1 rounded-md">{student.yearGroup}</span>}
                          </div>
                          <p className="text-sm font-bold text-[#A3AED0] mb-2">{student.email}</p>
                          <div className="flex gap-2">
                            <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2 py-1 rounded-lg">{completedCount} Completed</span>
                            <span className="bg-amber-100 text-amber-700 text-xs font-black px-2 py-1 rounded-lg">{pendingCount} Review</span>
                          </div>
                        </div>
                        
                        </div>

                      <div className="w-full bg-white p-3 rounded-2xl shadow-sm mt-2">
                        <div className="flex justify-between text-xs font-black text-[#A3AED0] mb-2">
                          <span>Average Performance</span>
                          <span className={avgScore >= 80 ? 'text-emerald-500' : avgScore >= 50 ? 'text-amber-500' : 'text-rose-500'}>{avgScore}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className={`h-2 rounded-full ${avgScore >= 80 ? 'bg-emerald-500' : avgScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: progressWidth }}></div>
                        </div>
                      </div>

                    </div>
                  );
                })}

                {students.length === 0 && (
                  <div className="col-span-full text-center py-20 text-[#A3AED0] font-bold">
                    No students have registered yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 3: SETTINGS TAB (Profile & Danger Zone) */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-fade-in">
              
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex flex-col">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                  <div className="bg-indigo-500 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#1B2559]">Profile Settings</h2>
                </div>

                <div className="space-y-6 flex flex-col h-full">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      {settingsForm.profilePic ? (
                        <img src={settingsForm.profilePic} alt="Profile" className="w-24 h-24 rounded-3xl object-cover shadow-md" />
                      ) : (
                        <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center text-4xl shadow-md">👤</div>
                      )}
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-3xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicUpload} />
                        <span className="text-xs font-bold">Upload</span>
                      </label>
                    </div>
                    <div>
                      <h3 className="font-black text-[#1B2559]">Profile Picture</h3>
                      <p className="text-xs font-bold text-[#A3AED0]">JPG, PNG under 2MB</p>
                      {isProfileUploading && <p className="text-xs text-amber-500 mt-1">Uploading...</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Display Name</label>
                    <input type="text" className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold text-[#1B2559]" 
                      value={settingsForm.name} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} />
                  </div>

                  <button onClick={handleSaveSettings} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg transition-transform hover:-translate-y-1">
                    Save Profile Update
                  </button>
                </div>
              </div>

              {/* Danger Zone: Delete Student */}
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex flex-col">
                <div className="flex items-center gap-3 mb-8 border-b border-rose-100 pb-6">
                  <div className="bg-rose-500 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-rose-600">Danger Zone</h2>
                </div>

                <div className="space-y-6 flex flex-col h-full">
                  <p className="text-sm font-bold text-slate-500">Deleting a student will permanently remove all work. </p>
                  
                  <div className="space-y-2">
  <label className="text-xs font-black text-rose-400 uppercase tracking-wide">
    Select a Student to Delete
  </label>
  <select
    className="w-full p-4 bg-rose-50 text-rose-900 border border-rose-100 rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/20 font-bold"
    value={settingsForm.studentToDelete}
    onChange={e => setSettingsForm({...settingsForm, studentToDelete: e.target.value})}
  >
    <option value="">-- Choose a Student --</option>
    {students.map(s => (
      <option key={s._id} value={s._id}>
        {s.name} ({s.email})
      </option>
    ))}
  </select>
</div>

<div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
  <p className="text-sm font-semibold text-rose-700">
    Warning: This action
    cannot be undone.
  </p>
</div>

                  <button 
                    onClick={() => {
                      if (!settingsForm.studentToDelete) return showToast("Select a student first!", "error");
                      setModal({ type: 'deleteStudent', studentId: settingsForm.studentToDelete, data: '' });
                    }} 
                    className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl shadow-lg transition-transform hover:-translate-y-1"
                  >
                    
                    Delete Selected Student
                  </button>
                </div>
              </div>

            </div>
          )}
          {/* 🟢 VIEW 3.5: ANNOUNCEMENTS TAB */}
          {activeTab === 'announcements' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in">
              <div className="xl:col-span-5 bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] h-fit">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-amber-500 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#1B2559]">Post Announcement</h2>
                </div>
                
                <form onSubmit={handleAnnouncementSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Message Content</label>
                    <textarea className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold text-[#1B2559] min-h-[140px]" 
                      placeholder="e.g., Tomorrow's class is rescheduled..." required value={announcementForm.content}
                      onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Target Audience</label>
                    <select className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]" 
                      value={announcementForm.targetAudience} onChange={e => setAnnouncementForm({...announcementForm, targetAudience: e.target.value})}>
                      <option value="all">📢 Share to Everyone</option>
                      {students.map(s => <option key={s._id} value={s._id}>👤 {s.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Attach Image (Optional)</label>
                    <div className="relative border-2 border-dashed border-slate-300 bg-slate-50 rounded-2xl p-4 text-center hover:bg-slate-100 transition-colors cursor-pointer group">
                      <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleAnnounceImageUpload} />
                      <p className="font-bold text-slate-600 text-sm">{announcementForm.imageUrl ? '✅ Image Attached' : 'Click to upload Image'}</p>
                      {isAnnounceUploading && <p className="text-xs text-amber-500 mt-1">Uploading...</p>}
                    </div>
                  </div>

                  <button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-2xl transition-transform hover:-translate-y-1 shadow-lg text-lg">
                    Broadcast Message
                  </button>
                </form>
              </div>

              {/* History & Read Receipts */}
              <div className="xl:col-span-7 bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px]">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                  <div className="bg-indigo-500 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#1B2559]">Notice Board History</h2>
                </div>
                
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {announcements.map(ann => (
                    <div key={ann._id} className="p-6 bg-[#F4F7FE] rounded-3xl relative group border border-transparent hover:border-indigo-100 transition-colors">
                      <button type="button" onClick={() => handleDeleteAnnouncement(ann._id)} className="absolute top-4 right-4 w-8 h-8 bg-white text-rose-500 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm">🗑️</button>
                      
                      <div className="flex gap-2 mb-3">
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                          {ann.targetAudience === 'all' ? 'Everyone' : 'Specific Student'}
                        </span>
                        <span className="text-xs font-bold text-[#A3AED0] flex items-center">{new Date(ann.createdAt).toLocaleString()}</span>
                      </div>
                      
                      <p className="text-[#1B2559] font-bold whitespace-pre-wrap mb-4 text-lg">{ann.content}</p>
                      
                      {ann.imageUrl && (
                        <img src={ann.imageUrl} alt="Announcement" className="w-full max-w-sm rounded-xl mb-4 border-4 border-white shadow-sm" />
                      )}
                      
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs font-black text-emerald-600 mb-2">Read by {ann.readBy.length} student(s):</p>
                        <div className="flex flex-wrap gap-2">
                          {ann.readBy.map(student => (
                            <span key={student._id} className="bg-white text-slate-700 text-xs px-2 py-1 rounded-md font-bold shadow-sm">{student.name}</span>
                          ))}
                          {ann.readBy.length === 0 && <span className="text-slate-400 text-xs font-bold">No reads yet</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {announcements.length === 0 && <p className="text-center text-[#A3AED0] font-bold py-10">No announcements posted yet.</p>}
                </div>
              </div>
            </div>
          )}
          {/* VIEW 4: ANALYTICS TAB */}
          {activeTab === 'analytics' && (() => {
            const studentHwForPie = selectedStudentForChart === 'all' 
              ? homeworks 
              : homeworks.filter(h => h.studentId?._id === selectedStudentForChart);
              
            const pieData = [
              { name: 'Completed & Graded', value: studentHwForPie.filter(h => h.status === 'Graded').length, color: '#10B981' }, 
              { name: 'Submitted (Pending Review)', value: studentHwForPie.filter(h => h.status === 'Submitted').length, color: '#F59E0B' }, 
              { name: 'Pending Work', value: studentHwForPie.filter(h => h.status === 'Pending').length, color: '#EF4444' } 
            ].filter(d => d.value > 0);

            return (
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in">
                
                {/* Header & Export Button */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-sky-500 w-2 h-8 rounded-full"></div>
                    <h2 className="text-2xl font-black text-[#1B2559]">Class Performance Analytics</h2>
                  </div>
                  <button onClick={handleExportPDF} className="px-5 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white font-black rounded-xl transition-colors shadow-sm flex items-center gap-2 border border-indigo-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Export Full PDF Report
                  </button>
                </div>

                <div id="analytics-export-area" className="space-y-8 bg-white p-2">
                  
                  {/* BAR CHART SECTION */}
                  <div className="bg-[#F4F7FE]/50 p-6 rounded-3xl border border-slate-100">
                    <div className="mb-6">
                      <h3 className="text-xl font-black text-[#1B2559]">Average Scores per Assignment</h3>
                      <p className="text-slate-500 text-sm font-bold mt-1">Class average for graded topics.</p>
                    </div>
                    {chartData.length > 0 ? (
                      <div className="h-[350px] w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontWeight: 600 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontWeight: 600 }} domain={[0, 100]} dx={-10} />
                            <Tooltip cursor={{ fill: '#F4F7FE' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold' }} />
                            <Bar dataKey="avgScore" name="Average Score (%)" fill="#4F46E5" radius={[8, 8, 0, 0]} barSize={50} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[250px] text-center opacity-50">
                        <p className="font-bold text-[#1B2559]">Not enough graded data yet.</p>
                      </div>
                    )}
                  </div>

                  {/* PIE CHART SECTION */}
                  <div className="bg-[#F4F7FE]/50 p-6 rounded-3xl border border-slate-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                      <div>
                        <h3 className="text-xl font-black text-[#1B2559]">Task Completion Breakdown</h3>
                        <p className="text-slate-500 text-sm font-bold mt-1">View status distribution by individual student.</p>
                      </div>
                      
                      {/* Individual Student Filter Dropdown */}
                      <select 
                        className="p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold text-[#1B2559] min-w-[200px]"
                        value={selectedStudentForChart}
                        onChange={e => setSelectedStudentForChart(e.target.value)}
                      >
                        <option value="all">Entire Class</option>
                        {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                    </div>
                    
                    {pieData.length > 0 ? (
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value"
                              label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                              {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 'bold' }} />
                            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontWeight: 'bold' }}/>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[200px] text-center opacity-50">
                        <p className="font-bold text-[#1B2559]">No tasks assigned yet.</p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })()}

          {/* VIEW 5: MESSAGES TAB */}
          {activeTab === 'messages' && (
            <div className="bg-white p-6 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] flex overflow-hidden animate-fade-in gap-6">
              
              {/* Left Side: Student List */}
              <div className="w-1/3 border-r border-slate-100 pr-4 flex flex-col">
                <h2 className="text-xl font-black text-[#1B2559] mb-6">Conversations</h2>
                <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2">
                  {students.map(student => (
                    <button key={student._id} 
                      onClick={() => { setSelectedStudentForChat(student); fetchMessages(student._id); }}
                      className={`w-full text-left p-4 rounded-2xl font-bold transition-colors flex items-center gap-3 ${selectedStudentForChat?._id === student._id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center font-black">{student.name.charAt(0)}</div>
                      <div className="truncate">
                        <p>{student.name}</p>
                        <p className="text-xs text-slate-400 font-medium truncate">{student.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Side: Chat Window */}
              <div className="w-2/3 flex flex-col bg-[#F4F7FE]/50 rounded-3xl overflow-hidden relative">
                {selectedStudentForChat ? (
                  <>
                    <div className="bg-white p-4 border-b border-slate-100 font-black text-[#1B2559] flex items-center gap-3 shadow-sm z-10">
                      <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center">{selectedStudentForChat.name.charAt(0)}</div>
                      Chatting with {selectedStudentForChat.name}
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
                      {messages.map(msg => (
                        <div key={msg._id} className={`flex ${msg.sender === userId ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-4 rounded-2xl ${msg.sender === userId ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}`}>
                            <p className="font-bold">{msg.content}</p>
                            <span className={`text-[10px] block mt-1 ${msg.sender === userId ? 'text-indigo-200' : 'text-slate-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                      {messages.length === 0 && <p className="text-center text-slate-400 font-bold mt-10">No messages yet. Say hello!</p>}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                      <input type="text" className="flex-1 p-4 bg-[#F4F7FE] border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-[#1B2559]" 
                        placeholder="Type your message..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                      <button className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-md">Send</button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <div className="text-6xl mb-4 opacity-30">💬</div>
                    <p className="font-bold">Select a student from the left to start chatting.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW 6: STUDY LIBRARY (ADMIN) */}
          {activeTab === 'library' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in">
              
              {/* Left Side: Upload Form */}
              <div className="xl:col-span-4 bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] h-fit">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-cyan-500 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#1B2559]">Add Material</h2>
                </div>
                
                <form onSubmit={handleResourceSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Title</label>
                    <input type="text" required className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold text-[#1B2559]" 
                      placeholder="e.g. Chapter 4 Calculus Notes" value={resourceForm.title} onChange={e => setResourceForm({...resourceForm, title: e.target.value})} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Resource Type</label>
                    <select className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]" 
                      value={resourceForm.type} onChange={e => setResourceForm({...resourceForm, type: e.target.value, url: ''})}>
                      <option value="Document">📄 PDF / Document</option>
                      <option value="Video Link">📺 YouTube / Video Link</option>
                      <option value="External Link">🔗 External Website</option>
                    </select>
                  </div>

                  {resourceForm.type === 'Document' ? (
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Upload File</label>
                      <div className="relative border-2 border-dashed border-slate-300 bg-slate-50 rounded-2xl p-4 text-center hover:bg-slate-100 transition-colors cursor-pointer group">
                        <input type="file" accept=".pdf, image/*" required className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleResourceFile} />
                        <p className="font-bold text-slate-600 text-sm">{resourceForm.url ? '✅ File Attached' : 'Click to upload PDF/Image'}</p>
                        {isResourceUploading && <p className="text-xs text-amber-500 mt-1">Uploading...</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Paste URL</label>
                      <input type="url" required className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold text-[#1B2559]" 
                        placeholder="https://..." value={resourceForm.url} onChange={e => setResourceForm({...resourceForm, url: e.target.value})} />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Short Description (Optional)</label>
                    <textarea className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold text-[#1B2559]" 
                      placeholder="What is this material about?" value={resourceForm.description} onChange={e => setResourceForm({...resourceForm, description: e.target.value})} />
                  </div>

                  <button disabled={isResourceUploading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-black py-4 rounded-2xl transition-transform hover:-translate-y-1 shadow-lg text-lg disabled:opacity-50">
                    Publish Material
                  </button>
                </form>
              </div>

              {/* Right Side: Resource List */}
              <div className="xl:col-span-8 bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px]">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                  <div className="bg-indigo-500 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#1B2559]">Resource Library</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {resources.map(res => (
                    <div key={res._id} className="p-6 bg-[#F4F7FE] rounded-3xl relative group border border-transparent hover:border-cyan-200 transition-colors flex flex-col justify-between">
                      <button type="button" onClick={() => handleDeleteResource(res._id)} className="absolute top-4 right-4 w-8 h-8 bg-white text-rose-500 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm">🗑️</button>
                      
                      <div>
                        <div className="flex gap-2 mb-3">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider
                            ${res.type === 'Document' ? 'bg-rose-100 text-rose-700' : res.type === 'Video Link' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'}`}>
                            {res.type}
                          </span>
                        </div>
                        <h3 className="text-[#1B2559] font-black text-xl mb-2">{res.title}</h3>
                        {res.description && <p className="text-sm font-bold text-[#A3AED0] mb-4">{res.description}</p>}
                      </div>
                      
                      <button onClick={() => {
                          const a = document.createElement('a');
                          a.href = res.url;
                          a.target = "_blank";
                          if (res.type === 'Document') a.download = `${res.title.replace(/\s+/g, '_')}`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }} 
                        className="mt-4 w-full py-3 bg-white text-[#1B2559] hover:bg-cyan-50 hover:text-cyan-700 font-black rounded-xl transition-all shadow-sm border border-slate-200 flex justify-center items-center gap-2">
                        {res.type === 'Document' ? '⬇️ Download' : '🔗 Open Link'}
                      </button>
                    </div>
                  ))}
                  {resources.length === 0 && <div className="col-span-full text-center text-[#A3AED0] font-bold py-10">Library is empty. Add some materials!</div>}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}