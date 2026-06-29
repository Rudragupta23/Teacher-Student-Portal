import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import html2canvas from 'html2canvas';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export default function AdminDashboard() {
  // Navigation & Data State
  const { user } = useContext(AuthContext);
  // const [activeTab, setActiveTab] = useState(user?.role === 'grader' ? 'submitted' : 'dashboard');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [homeworks, setHomeworks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [minDateTime, setMinDateTime] = useState('');
  const [selectedStudentForChart, setSelectedStudentForChart] = useState('all');
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({ content: '', targetAudience: 'all', imageUrl: '' });
  const [isAnnounceUploading, setIsAnnounceUploading] = useState(false);

  const [yearGroupAssign, setYearGroupAssign] = useState('all');
  const [yearGroupAllocate, setYearGroupAllocate] = useState('all');
  const [selectedStudentsToAllocate, setSelectedStudentsToAllocate] = useState([]);

  // Form State
  const [assignForm, setAssignForm] = useState({
    title: '', weekNo: '', topic: '', type: 'File', studentId: 'all', difficulty: 'Medium', 
    dueDate: '', fileUrl: '', content: '', 
    mcqs: [{ question: '', options: ['', '', '', ''], correctOption: 0 }]
  });
  const [testForm, setTestForm] = useState({
    title: '', weekNo: '', topic: '', type: 'File', studentId: 'all', difficulty: 'Easy', 
    startDate: '', dueDate: '', fileUrl: '', content: '', 
    mcqs: [{ question: '', options: ['', '', '', ''], correctOption: 0 }]
  });
  const [testYearGroupAssign, setTestYearGroupAssign] = useState('all');
  const [testFileName, setTestFileName] = useState('');

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

  // Scheme of Work States
  const [schemes, setSchemes] = useState([]);
  const [schemeForm, setSchemeForm] = useState({ date: new Date().toISOString().split('T')[0], title: '', weekNo: '', topic: '', description: '', classTaken: true });
  const [graderInstruction, setGraderInstruction] = useState('');

  const [chatTarget, setChatTarget] = useState('student'); // Tracks if admin is chatting with 'student' or 'parent'
  const [selectedParent, setSelectedParent] = useState(null); // Stores the fetched parent data

  const [graders, setGraders] = useState([]);
  const [newGraderEmail, setNewGraderEmail] = useState('');
  const [newGraderName, setNewGraderName] = useState('');

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
      // --- FIX: Role-based data fetching to prevent 403 crashes for Graders ---
      // if (user?.role === 'admin') {
      //   const [studentRes, hwRes, annRes, resRes, graderRes] = await Promise.all([
      //     api.get('/admin/students'),
      //     api.get('/homework/admin'),
      //     api.get('/announcements/admin'),
      //     api.get('/resources'),
      //     api.get('/admin/graders').catch(() => ({ data: [] })) // Prevent minor crashes
      //   ]);
      //   setStudents(studentRes.data);
      //   setHomeworks(hwRes.data);
      //   setAnnouncements(annRes.data);
      //   setResources(resRes.data); 
      //   setGraders(graderRes.data);
      // } else if (user?.role === 'grader') {
      //   // Graders need their specific homework submissions AND their allocated students
      //   const [studentRes, hwRes] = await Promise.all([
      //     api.get('/admin/students'),
      //     api.get('/homework/admin')
      //   ]);
      //   setStudents(studentRes.data);
      //   setHomeworks(hwRes.data);
      // }
      if (user?.role === 'admin') {
        const [studentRes, hwRes, annRes, resRes, graderRes, schemeRes] = await Promise.all([
          api.get('/admin/students'), api.get('/homework/admin'), api.get('/announcements/admin'),
          api.get('/resources'), api.get('/admin/graders').catch(() => ({ data: [] })), api.get('/scheme')
        ]);
        setStudents(studentRes.data); setHomeworks(hwRes.data); setAnnouncements(annRes.data);
        setResources(resRes.data); setGraders(graderRes.data); setSchemes(schemeRes.data);
      } else if (user?.role === 'grader') {
        const [studentRes, hwRes, schemeRes] = await Promise.all([
          api.get('/admin/students'), api.get('/homework/admin'), api.get('/scheme')
        ]);
        setStudents(studentRes.data); setHomeworks(hwRes.data); setSchemes(schemeRes.data);
      }
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

    // Determine correct ID based on whether we are talking to Student or Parent
    const targetId = chatTarget === 'parent' && selectedParent
      ? selectedParent._id
      : selectedStudentForChat._id;

    try {
      await api.post('/messages', { receiverId: targetId, content: chatInput });
      setChatInput('');
      fetchMessages(targetId); 
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

  const updateMcq = (index, field, value, optionIndex = null) => {
    // --- FIX: Safely deep clone the state to prevent React input freezing ---
    const updatedMcqs = assignForm.mcqs.map((mcq, i) => {
      if (i === index) {
        if (field === 'options') {
          const newOptions = [...mcq.options];
          newOptions[optionIndex] = value;
          return { ...mcq, options: newOptions };
        }
        return { ...mcq, [field]: value };
      }
      return mcq;
    });
    
    setAssignForm({ ...assignForm, mcqs: updatedMcqs });
  };

  // --- NEW FIX: Missing addMcq function ---
  const addMcq = () => {
    setAssignForm({
      ...assignForm,
      mcqs: [...assignForm.mcqs, { question: '', options: ['', '', '', ''], correctOption: 0 }]
    });
  };

  // --- NEW HANDLERS FOR TESTS ---
  const handleTestFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) return showToast("File is too large! Max 5MB.", "error");
      setTestFileName(file.name);
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTestForm({ ...testForm, fileUrl: reader.result });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateTestMcq = (index, field, value, optionIndex = null) => {
    const updatedMcqs = testForm.mcqs.map((mcq, i) => {
      if (i === index) {
        if (field === 'options') {
          const newOptions = [...mcq.options];
          newOptions[optionIndex] = value;
          return { ...mcq, options: newOptions };
        }
        return { ...mcq, [field]: value };
      }
      return mcq;
    });
    setTestForm({ ...testForm, mcqs: updatedMcqs });
  };

  const addTestMcq = () => {
    setTestForm({
      ...testForm,
      mcqs: [...testForm.mcqs, { question: '', options: ['', '', '', ''], correctOption: 0 }]
    });
  };
  // -----------------------------

  const executeModalAction = async () => {
    try {
      if (modal.type === 'grade') {
        const hasScores = modal.data.score !== '' && modal.data.totalScore !== '';
        
        if (!hasScores && !answerSheet.fileUrl) {
          return showToast("Enter marks or attach marked work!", "error");
        }

        // --- NEW VALIDATION CHECK ---
        if (hasScores) {
          const earned = Number(modal.data.score);
          const total = Number(modal.data.totalScore);
          
          if (earned < 0 || total < 0) {
            return showToast("Scores cannot be negative numbers!", "error");
          }
          if (total === 0) {
            return showToast("Total score cannot be zero!", "error");
          }
          if (earned > total) {
            return showToast("Score cannot be greater than the total score!", "error");
          }
        }
        // -----------------------------
        
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
      else if (modal.type === 'allocate') {
        await api.put(`/admin/graders/${modal.graderId}/allocate`, { studentIds: selectedStudentsToAllocate });
        showToast("Students successfully allocated to grader!");
      }
      else if (modal.type === 'graderInstruction') {
        await api.post('/scheme', { ...schemeForm, graderInstruction });
        showToast("Daily Report Submitted!");
        setSchemeForm({ date: new Date().toISOString().split('T')[0], title: '', weekNo: '', topic: '', description: '', classTaken: true });
        setGraderInstruction('');
      }
      
      setModal({ type: null, hwId: null, studentId: null, data: '' });
      setAnswerSheet({ fileUrl: '', fileName: '', isUploading: false }); 
      fetchData();
    } catch (error) {
      showToast(error.response?.data?.message || "Action failed.", "error");
    }
  };
  const handleSchemeInitialSubmit = async (e) => {
    e.preventDefault();
    
    // Check if we already have a submission in progress to prevent double-click
    if (isLoading) return; 

    if (schemeForm.classTaken) {
      setModal({ type: 'graderInstruction', data: '' });
    } else {
      // Direct submission for 'No Class'
      await executeSchemeSubmitDirect();
    }
  };

  const executeSchemeSubmitDirect = async () => {
    try {
      setIsLoading(true); // Disable buttons
      await api.post('/scheme', { 
        ...schemeForm, 
        graderInstruction: graderInstruction || '' // Ensure this sends correctly
      });
      showToast("Daily Report Submitted!");
      // Reset form
      setSchemeForm({ date: new Date().toISOString().split('T')[0], title: '', weekNo: '', topic: '', description: '', classTaken: true });
      setGraderInstruction('');
      setModal({ type: null });
      fetchData(); // Refresh list once
    } catch(err) { 
      showToast("Error submitting report", "error"); 
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHomeworks = homeworks.filter(hw => 
    !hw.isTest && (hw.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    hw.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const filteredTests = homeworks.filter(hw => 
    hw.isTest && (hw.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    hw.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
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

      return `"${student.registrationName || student.name} ${student.yearGroup ? `- ${student.yearGroup}` : ''}","${student.email}",${completedCount},${pendingCount},${avgScore}`;
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

        tableRows.push([`${student.registrationName || student.name} ${student.yearGroup ? `- ${student.yearGroup}` : ''}`, student.email, completedCount.toString(), pendingCount.toString(), `${avgScore}%`]);
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
            {modal.type === 'allocate' && (
              <>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Allocate Students</h3>
                <p className="text-slate-500 text-sm mb-4">Select the specific students this grader will mark.</p>
                
                {/* NEW: Grader Info & Currently Assigned Counter */}
                {(() => {
                  const currentGrader = graders.find(g => g._id === modal.graderId);
                  const initiallyAssigned = currentGrader?.allocatedStudents?.length || 0;
                  return (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4 flex justify-between items-center">
                       <span className="text-sm font-bold text-indigo-800">Grader: <b>{currentGrader?.name}</b></span>
                       <span className="text-xs font-black bg-indigo-200 text-indigo-800 px-2 py-1 rounded-md">
                         {initiallyAssigned} Currently Assigned
                       </span>
                    </div>
                  );
                })()}

                <select className="w-full p-3 mb-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                  value={yearGroupAllocate} onChange={e => setYearGroupAllocate(e.target.value)}>
                  <option value="all">Filter by Year Group (All)</option>
                  {[...new Set(students.map(s => s.yearGroup).filter(Boolean))].map(yg => (
                    <option key={yg} value={yg}>{yg}</option>
                  ))}
                </select>

                <div className="max-h-48 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 mb-6 custom-scrollbar">
                  {students.filter(s => yearGroupAllocate === 'all' || s.yearGroup === yearGroupAllocate).map(s => {
                    // Check if student is already in the database for this grader
                    const isInitiallyAllocated = graders.find(g => g._id === modal.graderId)?.allocatedStudents?.some(allocated => allocated._id === s._id || allocated === s._id);
                    
                    return (
                      <label key={s._id} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${selectedStudentsToAllocate.includes(s._id) ? 'bg-indigo-50/50' : 'hover:bg-slate-200'}`}>
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" 
                            checked={selectedStudentsToAllocate.includes(s._id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedStudentsToAllocate([...selectedStudentsToAllocate, s._id]);
                              else setSelectedStudentsToAllocate(selectedStudentsToAllocate.filter(id => id !== s._id));
                            }}
                          />
                          <span className="font-bold text-sm text-slate-700">{s.registrationName || s.name} {s.yearGroup ? `(${s.yearGroup})` : ''}</span>
                        </div>
                        
                        {/* NEW: Badge for already assigned students */}
                        {isInitiallyAllocated && (
                           <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md shadow-sm">
                             Already Assigned
                           </span>
                        )}
                      </label>
                    );
                  })}
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
            {modal.type === 'graderInstruction' && modal.data !== 'skip' && (
              <>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Instruction for Grader</h3>
                <p className="text-slate-500 text-sm mb-6">Optional: Do you want to send any specific instructions to the grader for today's homework?</p>
                <textarea className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-medium text-[#1B2559] min-h-[120px] mb-6" 
                  placeholder="e.g. Please assign 5 hard questions on algebra..." 
                  value={graderInstruction} onChange={e => setGraderInstruction(e.target.value)} />
              </>
            )}
            <div className="flex gap-4">
              {modal.type === 'viewWork' ? (
                <button onClick={() => setModal({ type: null, hwId: null, studentId: null, data: '' })} className="w-full py-4 bg-slate-100 text-slate-700 hover:bg-slate-200 font-black rounded-2xl transition-colors">
                  Close Preview
                </button>
              ) : (
                <>
                  <button onClick={() => { 
  setModal({ type: null, hwId: null, studentId: null, data: '' }); 
  setAnswerSheet({ fileUrl: '', fileName: '', isUploading: false }); 
  setGraderInstruction(''); // <--- ADD THIS
  setSchemeForm({ date: new Date().toISOString().split('T')[0], title: '', weekNo: '', topic: '', description: '', classTaken: true }); // <--- ADD THIS
}} className="flex-1 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold rounded-2xl transition-colors">
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
            <h1 className="text-lg font-black text-white tracking-wide leading-tight">MathCom<br/>Mentors</h1>
            {user?.role === 'admin' && (
              <p className="text-xs font-bold text-indigo-300 mt-1.5 tracking-widest uppercase bg-slate-800/80 inline-block px-2 py-1 rounded-md border border-slate-700">
                Code: MATH_2026
              </p>
            )}
          </div>
        </div>
        
        {/* 2. Navigation Links */}
        <div className="relative flex-1 flex flex-col overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#0B1437] to-transparent pointer-events-none z-10"></div>
          
          <div className="p-6 space-y-3 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            {/* BOTH ADMIN AND GRADER CAN SEE THESE TABS */}
            {(user?.role === 'admin' || user?.role === 'grader') && (
              <>
                <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                  Create Assignment 
                </button>

                <button onClick={() => setActiveTab('submitted')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'submitted' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Submitted Work 
                </button>

                <button onClick={() => setActiveTab('tests')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'tests' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Schedule Tests 
                </button>
                <button onClick={() => setActiveTab('scheme')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'scheme' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Scheme of Work
                </button>
              </>
            )}
            
            {/* ONLY ADMIN CAN SEE THESE TABS */}
            {user?.role === 'admin' && (
              <>
                <button onClick={() => setActiveTab('students')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'students' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                  Students Enrolled
                </button>

                {/* 👨‍🏫 Manage Graders Tab (Admin Only) - Added matching SVG Icon */}
                <button onClick={() => setActiveTab('graders')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'graders' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  Manage Graders
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
              </>
            )}

            {/* NEW: Grader View (Both Admin & Grader see this tab)
            {user?.role === 'grader' && (
              <button onClick={() => setActiveTab('submitted')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'submitted' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Submitted Work 
              </button>
            )} */}
            
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
            
            {/* ONLY ADMIN CAN SEE THE TOTAL STUDENTS COUNTER */}
            {user?.role === 'admin' && (
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
            )}
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

                  {/* NEW WEEK AND TOPIC FIELDS */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Week No</label>
                      <input type="text" className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/20 text-[#1B2559] outline-none transition-all font-bold" 
                        placeholder="e.g. 5" value={assignForm.weekNo} onChange={e => setAssignForm({...assignForm, weekNo: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Topic Covered</label>
                      <input type="text" className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/20 text-[#1B2559] outline-none transition-all font-bold" 
                        placeholder="e.g. Algebra" value={assignForm.topic} onChange={e => setAssignForm({...assignForm, topic: e.target.value})} />
                    </div>
                  </div>

                  {/* FILTER BY YEAR, STUDENT, AND DIFFICULTY */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* 1. Year Group Filter (Top Left) */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Filter by Year</label>
                      <select className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]"
                        value={yearGroupAssign} onChange={e => setYearGroupAssign(e.target.value)}>
                        <option value="all">All Years</option>
                        {[...new Set(students.map(s => s.yearGroup).filter(Boolean))].map(yg => (
                          <option key={yg} value={yg}>{yg}</option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Difficulty (Top Right) */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Difficulty</label>
                      <select className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]" 
                        onChange={e => setAssignForm({...assignForm, difficulty: e.target.value})}>
                        <option value="Easy">Easy 🟢</option>
                        <option value="Medium">Medium 🟡</option>
                        <option value="Hard">Hard 🔴</option>
                      </select>
                    </div>

                    {/* 3. Student Dropdown (Bottom Row - Full Width) */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Select Student</label>
                      <select className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]" 
                        onChange={e => setAssignForm({...assignForm, studentId: e.target.value})} value={assignForm.studentId}>
                        <option value="all">All Filtered Students</option>
                        {students.filter(s => yearGroupAssign === 'all' || s.yearGroup === yearGroupAssign).map(s => (
                          <option key={s._id} value={s._id}>{s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}</option>
                        ))}
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
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-3">
                                  <label className="text-xs font-black text-[#A3AED0] uppercase">Correct Answer:</label>
                                  <select className="p-2 text-sm font-black border-none rounded-xl bg-emerald-100 text-emerald-800 outline-none cursor-pointer" 
                                    value={mcq.correctOption} onChange={(e) => updateMcq(qIndex, 'correctOption', parseInt(e.target.value))}>
                                    <option value={0}>Option 1</option><option value={1}>Option 2</option><option value={2}>Option 3</option><option value={3}>Option 4</option>
                                  </select>
                                </div>
                                
                                {/* NEW: Allow Admin to remove accidental questions (keep at least 1) */}
                                {assignForm.mcqs.length > 1 && (
                                  <button type="button" onClick={() => {
                                    const filteredMcqs = assignForm.mcqs.filter((_, i) => i !== qIndex);
                                    setAssignForm({...assignForm, mcqs: filteredMcqs});
                                  }} className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-2 rounded-lg hover:bg-rose-500 hover:text-white transition-colors">
                                    🗑️ Remove
                                  </button>
                                )}
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
                          
                          <p className="text-sm text-[#A3AED0] font-bold mb-4">
                          Assigned to: <span className="font-black text-[#1B2559]">
                          {hw.studentId ? `${hw.studentId.registrationName || hw.studentId.name} ${hw.studentId.yearGroup ? `- ${hw.studentId.yearGroup}` : ''}` : "Deleted User"}
                          </span>
                          </p>
                          
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1.5 bg-[#F4F7FE] text-[#A3AED0] px-3 py-1.5 rounded-xl text-xs font-black w-fit">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                              Due: {new Date(hw.dueDate).toLocaleString()}
                            </div>
                            {hw.submission?.submittedAt && (
                              <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-black w-fit">
                                📥 Submitted: {new Date(hw.submission.submittedAt).toLocaleString()}
                              </div>
                            )}
                            {isLate && hw.status === 'Pending' && <span className="bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-xs font-black w-fit">Overdue</span>}
                            {hw.submission?.submittedAt && new Date(hw.submission.submittedAt) > new Date(hw.dueDate) && (
                               <span className="bg-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-sm animate-pulse w-fit">⚠️ LATE SUBMISSION</span>
                            )}
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
                              {user?.role === 'admin' ? (
                                <>
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
                                </>
                              ) : (
                                <div className="px-6 py-3 bg-slate-50 text-slate-500 rounded-2xl font-black border border-slate-200 text-lg shadow-sm cursor-not-allowed" title="Only Admins can edit published marks">
                                  {hw.grading?.score != null ? `${hw.grading.score}/${hw.grading.totalScore} 🔒` : 'Marked 🔒'}
                                </div>
                              )}
                            </div>
                          )}

                          {user?.role === 'admin' && (
                            <button onClick={() => setModal({ type: 'delete', hwId: hw._id, data: '' })} className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-colors shadow-sm ml-2 text-xl" title="Delete">
                              🗑️
                            </button>
                          )}
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

          {/* NEW TAB: SCHEDULE TESTS */}
          {activeTab === 'tests' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in">
              <div className="xl:col-span-4 bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] h-fit">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-rose-500 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#1B2559]">Schedule Test</h2>
                </div>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!testForm.startDate || !testForm.dueDate) return showToast("Assign Start & Due Dates!", "error");
                  if (new Date(testForm.startDate) >= new Date(testForm.dueDate)) return showToast("Due date must be after Start date!", "error");
                  try {
                    await api.post('/homework/assign', { ...testForm, isTest: true });
                    showToast('🎉 Test scheduled successfully!');
                    fetchData(); 
                    setTestForm({ ...testForm, title: '', startDate: '', dueDate: '', fileUrl: '', content: '', mcqs: [{ question: '', options: ['', '', '', ''], correctOption: 0 }] });
                    setTestFileName(''); // Reset file name
                  } catch (err) { showToast('Error scheduling test.', "error"); }
                }} className="space-y-6">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Test Title</label>
                    <input className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl focus:ring-4 focus:ring-rose-500/20 text-[#1B2559] outline-none font-bold" 
                      placeholder="e.g., Midterm Exam" required value={testForm.title} onChange={e => setTestForm({...testForm, title: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Week No</label>
                      <input type="text" className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold focus:ring-4 focus:ring-rose-500/20 text-[#1B2559]" 
                        placeholder="e.g. 5" 
                        value={testForm.weekNo} onChange={e => setTestForm({...testForm, weekNo: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Topic</label>
                      <input type="text" className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold focus:ring-4 focus:ring-rose-500/20 text-[#1B2559]" 
                        placeholder="e.g. Algebra" 
                        value={testForm.topic} onChange={e => setTestForm({...testForm, topic: e.target.value})} />
                    </div>
                  </div>

                  {/* FILTER BY YEAR, STUDENT, AND DIFFICULTY */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Filter by Year</label>
                      <select className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]"
                        value={testYearGroupAssign} onChange={e => setTestYearGroupAssign(e.target.value)}>
                        <option value="all">All Years</option>
                        {[...new Set(students.map(s => s.yearGroup).filter(Boolean))].map(yg => (
                          <option key={yg} value={yg}>{yg}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Difficulty</label>
                      <select className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]" 
                        onChange={e => setTestForm({...testForm, difficulty: e.target.value})} value={testForm.difficulty}>
                        <option value="Easy">Easy 🟢</option>
                        <option value="Medium">Medium 🟡</option>
                        <option value="Hard">Hard 🔴</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Select Student</label>
                      <select className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]" 
                        onChange={e => setTestForm({...testForm, studentId: e.target.value})} value={testForm.studentId}>
                        <option value="all">All Filtered Students</option>
                        {students.filter(s => testYearGroupAssign === 'all' || s.yearGroup === testYearGroupAssign).map(s => (
                          <option key={s._id} value={s._id}>{s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* CALENDAR PICKERS */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-rose-500 uppercase tracking-wide ml-1">Start Date & Time (Unlocks)</label>
                      <input type="datetime-local" required min={minDateTime} className="w-full p-4 bg-rose-50 text-rose-800 rounded-2xl outline-none cursor-pointer font-bold" 
                        value={testForm.startDate} onChange={e => setTestForm({...testForm, startDate: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-rose-500 uppercase tracking-wide ml-1">Deadline Date & Time</label>
                      <input type="datetime-local" required min={testForm.startDate || minDateTime} className="w-full p-4 bg-rose-50 text-rose-800 rounded-2xl outline-none cursor-pointer font-bold" 
                        value={testForm.dueDate} onChange={e => setTestForm({...testForm, dueDate: e.target.value})} />
                    </div>
                  </div>

                  {/* FORMAT TYPE & BUILDER */}
                  <div className="space-y-1 pt-4 border-t border-slate-100">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Test Format Type</label>
                    <select className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl font-bold text-[#1B2559] outline-none mb-4 cursor-pointer" 
                      value={testForm.type} onChange={e => setTestForm({...testForm, type: e.target.value})}>
                      <option value="MCQ">Build Quiz (MCQ)</option>
                      <option value="File">Upload File (PDF/Image)</option>
                      <option value="Text">Write Question</option>
                    </select>

                    <div className="animate-fade-in">
                      {testForm.type === 'File' && (
                        <div className="relative border-2 border-dashed border-rose-300 bg-[#F4F7FE] rounded-3xl p-10 text-center hover:bg-rose-50 transition-colors cursor-pointer group">
                          <input type="file" accept=".pdf, image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleTestFileUpload} />
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform text-3xl">📁</div>
                          <p className="font-black text-[#1B2559]">Drag & Drop or Click</p>
                          <p className="text-xs font-bold text-[#A3AED0] mt-1">PDF, JPG, PNG up to 5MB</p>
                          {isUploading && <p className="mt-3 text-sm font-bold text-amber-500">Processing file...</p>}
                          {testFileName && !isUploading && <p className="mt-3 inline-block bg-white text-rose-800 px-4 py-2 rounded-full text-xs font-bold shadow-sm">{testFileName}</p>}
                        </div>
                      )}

                      {testForm.type === 'Text' && (
                        <textarea className="w-full p-5 bg-[#F4F7FE] border-none rounded-3xl outline-none focus:ring-4 focus:ring-rose-500/20 text-[#1B2559] font-medium min-h-[160px]" 
                          placeholder="Type test instructions or complete text here..." 
                          value={testForm.content} onChange={e => setTestForm({...testForm, content: e.target.value})} />
                      )}

                      {testForm.type === 'MCQ' && (
                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                          {testForm.mcqs.map((mcq, qIndex) => (
                            <div key={qIndex} className="p-5 bg-[#F4F7FE] rounded-3xl">
                              <input className="w-full p-2 mb-3 font-black border-b-2 border-slate-200 bg-transparent outline-none focus:border-rose-500 text-[#1B2559]" 
                                placeholder={`Question ${qIndex + 1}`} value={mcq.question} 
                                onChange={(e) => updateTestMcq(qIndex, 'question', e.target.value)} />
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                {mcq.options.map((opt, oIndex) => (
                                  <input key={oIndex} className="p-3 text-sm border-none rounded-xl bg-white outline-none focus:ring-2 focus:ring-rose-400 font-bold" 
                                    placeholder={`Option ${oIndex + 1}`} value={opt} 
                                    onChange={(e) => updateTestMcq(qIndex, 'options', e.target.value, oIndex)} />
                                ))}
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-3">
                                  <label className="text-xs font-black text-[#A3AED0] uppercase">Correct Answer:</label>
                                  <select className="p-2 text-sm font-black border-none rounded-xl bg-emerald-100 text-emerald-800 outline-none cursor-pointer" 
                                    value={mcq.correctOption} onChange={(e) => updateTestMcq(qIndex, 'correctOption', parseInt(e.target.value))}>
                                    <option value={0}>Option 1</option><option value={1}>Option 2</option><option value={2}>Option 3</option><option value={3}>Option 4</option>
                                  </select>
                                </div>
                                
                                {testForm.mcqs.length > 1 && (
                                  <button type="button" onClick={() => {
                                    const filteredMcqs = testForm.mcqs.filter((_, i) => i !== qIndex);
                                    setTestForm({...testForm, mcqs: filteredMcqs});
                                  }} className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-2 rounded-lg hover:bg-rose-500 hover:text-white transition-colors">
                                    🗑️ Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                          <button type="button" onClick={addTestMcq} className="w-full py-4 border-2 border-dashed border-rose-300 text-rose-500 rounded-3xl font-black hover:bg-rose-50 transition-colors">
                            + Add Next Question
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-[#1B2559] hover:bg-rose-600 text-white font-black py-5 rounded-2xl transition-all shadow-lg">Schedule Test</button>
                </form>
              </div>

              {/* TESTS TRACKER BOARD */}
              <div className="xl:col-span-8 bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px]">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                  <div className="bg-rose-500 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#1B2559]">Scheduled Tests</h2>
                </div>
                
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                  {filteredTests.map(hw => (
                    <div key={hw._id} className="p-6 bg-white border border-slate-100 hover:bg-rose-50 rounded-3xl flex justify-between items-center transition-all shadow-sm">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-black text-xl text-[#1B2559]">{hw.title}</h3>
                          <span className="text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider bg-rose-100 text-rose-700">TEST</span>
                        </div>
                        <p className="text-sm font-bold text-[#A3AED0] mb-2">Assigned to: {hw.studentId?.name || "All Students"}</p>
                        <div className="flex flex-col gap-1 text-xs font-black text-slate-500">
                           <p>🗓️ Opens: {new Date(hw.startDate).toLocaleString()}</p>
                           <p>⏰ Closes: {new Date(hw.dueDate).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                         {user?.role === 'admin' && (
                          <button onClick={() => setModal({ type: 'delete', hwId: hw._id, data: '' })} className="p-3 bg-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-colors shadow-sm ml-2 text-xl" title="Delete">
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredTests.length === 0 && <p className="text-center font-bold text-slate-400 py-10">No tests scheduled.</p>}
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
        {s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''} ({s.email})
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
                      {students.map(s => <option key={s._id} value={s._id}>👤 {s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}</option>)}
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
                            <span key={student._id} className="bg-white text-slate-700 text-xs px-2 py-1 rounded-md font-bold shadow-sm">
                              {student.registrationName || student.name} {student.yearGroup ? `- ${student.yearGroup}` : ''}
                            </span>
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
          {/* SCHEME OF WORK TAB */}
          {activeTab === 'scheme' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in">
              {/* Form (Admins Only) */}
              {user?.role === 'admin' && (
                <div className="xl:col-span-4 bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] h-fit">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="bg-fuchsia-500 w-2 h-8 rounded-full"></div>
                    <h2 className="text-2xl font-black text-[#1B2559]">Daily Report</h2>
                  </div>
                  
                  <form onSubmit={handleSchemeInitialSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs font-black text-[#A3AED0] uppercase">Date</label>
                      <input type="date" required className="w-full p-4 mt-1 bg-[#F4F7FE] border-none rounded-xl font-bold" value={schemeForm.date} onChange={e => setSchemeForm({...schemeForm, date: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-black text-[#A3AED0] uppercase">Lesson Title</label>
                      <input type="text" required placeholder="e.g. Intro to Algebra" className="w-full p-4 mt-1 bg-[#F4F7FE] border-none rounded-xl font-bold" value={schemeForm.title} onChange={e => setSchemeForm({...schemeForm, title: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-[#A3AED0] uppercase">Week No</label>
                        <input type="text" className="w-full p-4 mt-1 bg-[#F4F7FE] border-none rounded-xl font-bold" value={schemeForm.weekNo} onChange={e => setSchemeForm({...schemeForm, weekNo: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-black text-[#A3AED0] uppercase">Topic</label>
                        <input type="text" className="w-full p-4 mt-1 bg-[#F4F7FE] border-none rounded-xl font-bold" value={schemeForm.topic} onChange={e => setSchemeForm({...schemeForm, topic: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-black text-[#A3AED0] uppercase">Description (Optional)</label>
                      <textarea className="w-full p-4 mt-1 bg-[#F4F7FE] border-none rounded-xl font-bold min-h-[100px]" placeholder="What was covered today..." value={schemeForm.description} onChange={e => setSchemeForm({...schemeForm, description: e.target.value})} />
                    </div>
                    
                    <label className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 text-emerald-600 rounded" checked={schemeForm.classTaken} onChange={e => setSchemeForm({...schemeForm, classTaken: e.target.checked})} />
                      <span className="font-bold text-emerald-800 text-sm">Class Was Taken Today</span>
                    </label>

                    <button type="submit" className="w-full bg-[#1B2559] hover:bg-fuchsia-600 text-white font-black py-4 rounded-xl transition-all shadow-lg mt-4">
                      Submit Daily Report
                    </button>
                  </form>
                </div>
              )}

              {/* View Reports (Admins & Graders) */}
              <div className={user?.role === 'admin' ? "xl:col-span-8" : "xl:col-span-12"}>
                <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px]">
                  <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                    <div className="bg-indigo-500 w-2 h-8 rounded-full"></div>
                    <h2 className="text-2xl font-black text-[#1B2559]">Scheme of Work Logs</h2>
                  </div>
                  
                  <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                    {schemes.map(report => (
                      <div key={report._id} className={`p-6 rounded-3xl border-2 ${report.classTaken ? 'bg-[#F4F7FE] border-transparent' : 'bg-rose-50 border-rose-100'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-black text-xl text-[#1B2559]">{report.title}</h3>
                          <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase ${report.classTaken ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-500 text-white'}`}>
                            {report.classTaken ? '✅ Class Taken' : '❌ No Class'}
                          </span>
                        </div>
                        <p className="text-xs font-black text-[#A3AED0] mb-3">
                          {new Date(report.date).toLocaleDateString()} | Week {report.weekNo || 'N/A'} | Topic: {report.topic || 'N/A'}
                        </p>
                        {report.description && <p className="text-[#1B2559] font-medium mb-3">{report.description}</p>}
                        
                        {/* Only show grader instructions to Graders and Admins */}
                        {(user?.role === 'admin' || user?.role === 'grader') && report.graderInstruction && (
                          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded-r-xl mt-3">
                            <p className="text-xs font-black text-indigo-800 uppercase mb-1">Grader Instructions:</p>
                            <p className="text-indigo-900 font-medium text-sm">{report.graderInstruction}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    {schemes.length === 0 && <p className="text-center font-bold text-slate-400 py-10">No daily reports recorded yet.</p>}
                  </div>
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
                        {students.map(s => (
                          <option key={s._id} value={s._id}>
                            {s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}
                          </option>
                        ))}
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
                  {/* --- NEW GLOBAL CHAT BUTTON --- */}
                  <button 
                    onClick={() => { setSelectedStudentForChat({ _id: 'all', name: 'Entire Class', registrationName: 'Entire Class', yearGroup: '' }); fetchMessages('all'); }}
                    className={`w-full text-left p-4 rounded-2xl font-bold transition-colors flex items-center gap-3 mb-4 border-2 ${selectedStudentForChat?._id === 'all' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-full flex items-center justify-center font-black text-xl">🌍</div>
                    <div className="truncate">
                      <p className="flex items-center gap-2 text-[#1B2559]">Global Class Chat</p>
                      <p className="text-xs text-indigo-400 font-medium truncate">Message everyone</p>
                    </div>
                  </button>
                  {students.map(student => (
                    <button key={student._id} 
                      onClick={() => { 
                        setSelectedStudentForChat(student); 
                        setChatTarget('student'); // Reset toggle
                        setSelectedParent(null);  // Clear parent data
                        fetchMessages(student._id); 
                      }}
                      className={`w-full text-left p-4 rounded-2xl font-bold transition-colors flex items-center gap-3 ${selectedStudentForChat?._id === student._id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center font-black">{(student.registrationName || student.name).charAt(0)}</div>
                      <div className="truncate">
                        <p className="flex items-center gap-2">
                          {student.registrationName || student.name}
                          {student.yearGroup && <span className="text-[10px] bg-indigo-200/50 text-indigo-700 px-1.5 py-0.5 rounded-md">{student.yearGroup}</span>}
                        </p>
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
                    <div className="bg-white p-4 border-b border-slate-100 font-black text-[#1B2559] flex items-center justify-between shadow-sm z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center">{(selectedStudentForChat.registrationName || selectedStudentForChat.name).charAt(0)}</div>
                        Chatting with {selectedStudentForChat.registrationName || selectedStudentForChat.name} {selectedStudentForChat.yearGroup ? `(${selectedStudentForChat.yearGroup})` : ''}
                      </div>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 shadow-sm flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Chats delete after 24 hours
                      </span>
                    </div>

                    {/* --- START OF PARENT TOGGLE UI --- */}
                    {selectedStudentForChat._id !== 'all' && (
                      <div className="bg-[#F4F7FE] border-b border-slate-200 px-6 py-3 flex items-center justify-between z-0">
                        <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                          <button 
                            onClick={() => {
                              setChatTarget('student');
                              fetchMessages(selectedStudentForChat._id);
                            }} 
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${chatTarget === 'student' ? 'bg-[#1B2559] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
                            👨‍🎓 Chat with Student
                          </button>
                          <button 
                            onClick={async () => {
                              try {
                                const res = await api.get(`/admin/student/${selectedStudentForChat._id}/parent`);
                                setSelectedParent(res.data);
                                setChatTarget('parent');
                                fetchMessages(res.data._id); // Fetch parent's messages
                              } catch (err) {
                                showToast("No parent account is linked to this student yet.", "error");
                              }
                            }} 
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${chatTarget === 'parent' ? 'bg-violet-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
                            👨‍👩‍👦 Chat with Parent
                          </button>
                        </div>
                        
                        {chatTarget === 'parent' && selectedParent && (
  <div className="text-xs font-bold text-violet-700 bg-violet-100 px-3 py-1.5 rounded-lg border border-violet-200 shadow-sm">
    Messaging Parent: {selectedParent.registrationName || selectedParent.name}
  </div>
)}
                      </div>
                    )}
                    {/* --- END OF PARENT TOGGLE UI --- */}
                    
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
                      
                      {messages.map(msg => {
                        const isMe = typeof msg.sender === 'object' ? msg.sender._id === userId : msg.sender === userId;
                        
                        return (
                          <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-4 rounded-2xl ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}`}>
                              
                              {selectedStudentForChat?._id === 'all' && !isMe && msg.sender?.name && (
                                <span className="text-[10px] text-indigo-500 font-black mb-1 block uppercase">
                                  {msg.sender.registrationName || msg.sender.name}
                                </span>
                              )}
                              
                              <p className="font-bold">{msg.content}</p>
                              <span className={`text-[10px] block mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
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

          {/* ================= NEW GRADER MANAGEMENT TAB (ADMIN ONLY) ================= */}
          {activeTab === 'graders' && user?.role === 'admin' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                <div className="bg-indigo-500 w-2 h-8 rounded-full"></div>
                <h2 className="text-2xl font-black text-[#1B2559]">Manage Graders (Base Admins)</h2>
              </div>
              
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] mb-8">
                <h3 className="text-lg font-bold text-[#1B2559] mb-4">Create New Grader</h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <input type="text" placeholder="Grader Name" className="flex-1 p-4 bg-[#F4F7FE] border-none rounded-2xl font-bold text-[#1B2559] outline-none" value={newGraderName} onChange={(e) => setNewGraderName(e.target.value)} />
                  <input type="email" placeholder="Grader Email" className="flex-1 p-4 bg-[#F4F7FE] border-none rounded-2xl font-bold text-[#1B2559] outline-none" value={newGraderEmail} onChange={(e) => setNewGraderEmail(e.target.value)} />
                  <button onClick={async () => {
                    if (!newGraderName || !newGraderEmail) return showToast("Name and Email required", "error");
                    try {
                      const { data } = await api.post('/admin/graders', { email: newGraderEmail, name: newGraderName });
                      setGraders([...graders, data.grader]);
                      setNewGraderEmail(''); setNewGraderName('');
                      showToast('Grader created! Password sent to their email.');
                    } catch (err) { showToast(err.response?.data?.message || 'Error creating grader', 'error'); }
                  }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-md">
                    ➕ Create Grader
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {graders.map(grader => (
                  <div key={grader._id} className="bg-white p-6 rounded-3xl shadow-[0_18px_40px_rgba(112,144,176,0.12)] border border-transparent hover:border-indigo-100 transition-all">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-14 w-14 rounded-2xl bg-indigo-100 text-indigo-500 flex items-center justify-center text-2xl font-black">👨‍🏫</div>
                      <div>
                        <h4 className="font-black text-lg text-[#1B2559]">{grader.name}</h4>
                        <p className="text-[#A3AED0] text-sm font-bold">{grader.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full mt-4">
                      <button onClick={() => {
                        setSelectedStudentsToAllocate(grader.allocatedStudents?.map(s => s._id || s) || []);
                        setModal({ type: 'allocate', graderId: grader._id, data: '' });
                      }} className="flex-1 bg-indigo-50 text-indigo-600 font-black py-3 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-sm border border-indigo-200">
                        👥 Allocate Students
                      </button>
                      <button onClick={async () => {
                        if (window.confirm(`Are you sure you want to permanently delete the grader "${grader.name}"?`)) {
                          try {
                            await api.delete(`/admin/graders/${grader._id}`);
                            setGraders(graders.filter(g => g._id !== grader._id));
                            showToast('👨‍🏫 Grader deleted successfully!');
                          } catch (err) { 
                            showToast(err.response?.data?.message || 'Error deleting grader', 'error'); 
                          }
                        }
                      }} className="flex-1 bg-rose-50 text-rose-500 font-black py-3 rounded-xl hover:bg-rose-500 hover:text-white transition-all text-sm border border-rose-200">
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
                {graders.length === 0 && <p className="text-[#A3AED0] font-bold">No graders created yet.</p>}
              </div>
            </div>
          )}

          {/* ================= NEW SUBMITTED WORK TAB (ADMIN & GRADER) ================= */}
          {activeTab === 'submitted' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                <div className="bg-emerald-500 w-2 h-8 rounded-full"></div>
                <h2 className="text-2xl font-black text-[#1B2559]">Submitted Student Work</h2>
              </div>
              
              <div className="space-y-4">
                {homeworks.filter(hw => hw.status === 'Submitted' || hw.status === 'Graded').length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-6xl mb-6 opacity-50">📭</div>
                    <p className="text-[#1B2559] font-black text-xl mb-1">No submissions yet!</p>
                    <p className="text-[#A3AED0] font-bold">When students submit work, it will appear here for grading.</p>
                  </div>
                ) : (
                  homeworks.filter(hw => hw.status === 'Submitted' || hw.status === 'Graded').map(hw => (
                    <div key={hw._id} className="p-6 bg-[#F4F7FE] border border-transparent hover:border-indigo-100 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 transition-all">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-black text-xl text-[#1B2559]">{hw.title}</h3>
                          <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider ${hw.status === 'Submitted' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {hw.status}
                          </span>
                          {hw.submission?.submittedAt && new Date(hw.submission.submittedAt) > new Date(hw.dueDate) && (
                            <span className="text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider bg-rose-100 text-rose-700 shadow-sm border border-rose-200 animate-pulse">
                              LATE
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#A3AED0] font-bold mb-2">
                          Student: <span className="font-black text-[#1B2559]">{hw.studentId ? `${hw.studentId.registrationName || hw.studentId.name} ${hw.studentId.yearGroup ? `- ${hw.studentId.yearGroup}` : ''}` : "Unknown"}</span>
                        </p>
                        {hw.grading?.gradedBy && user?.role === 'admin' && (
                           <p className="text-xs text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded-md font-black">✅ Marked by a Grader</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {hw.status === 'Submitted' && (
                          <>
                            {hw.submission && (hw.submission.answerFileUrl || hw.submission.answerText) && (
                              <button onClick={() => setModal({ type: 'viewWork', hwId: hw._id, data: hw.submission, title: hw.title })} className="px-5 py-3 bg-[#1B2559] text-white font-black rounded-2xl hover:bg-indigo-900 transition-colors shadow-md text-sm">
                                View Work
                              </button>
                            )}
                            <button onClick={() => setModal({ type: 'grade', hwId: hw._id, data: { score: '', totalScore: '' } })} className="px-5 py-3 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 transition-transform hover:-translate-y-1 shadow-md text-sm">
                              Grade
                            </button>
                          </>
                        )}

                        {hw.status === 'Graded' && (
                          user?.role === 'admin' ? (
                            <button onClick={() => {
                              setModal({ type: 'grade', hwId: hw._id, data: { score: hw.grading?.score ?? '', totalScore: hw.grading?.totalScore ?? '' } });
                              if (hw.grading?.adminAnswerSheetUrl) setAnswerSheet({ fileUrl: hw.grading.adminAnswerSheetUrl, fileName: 'Attached', isUploading: false });
                            }} className="px-6 py-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-2xl font-black border border-emerald-200 text-sm">
                              {hw.grading?.score != null ? `${hw.grading.score}/${hw.grading.totalScore} ✏️` : 'Edit Grade'}
                            </button>
                          ) : (
                            <div className="px-6 py-3 bg-slate-50 text-slate-500 rounded-2xl font-black border border-slate-200 text-sm cursor-not-allowed" title="Only Admins can edit published marks">
                              {hw.grading?.score != null ? `${hw.grading.score}/${hw.grading.totalScore} 🔒` : 'Marked 🔒'}
                            </div>
                          )
                        )}
                        
                        {/* Only Admin can delete submissions here */}
                        {user?.role === 'admin' && (
                          <button onClick={() => setModal({ type: 'delete', hwId: hw._id, data: '' })} className="p-3 bg-white text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-colors shadow-sm ml-2 text-xl" title="Delete">
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}