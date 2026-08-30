import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Eye, EyeOff } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';

const getOverdueTime = (dueDate, submittedAt = null) => {
  const targetDate = submittedAt ? new Date(submittedAt) : new Date();
  const due = new Date(dueDate);
  const diffMs = targetDate - due;

  if (diffMs <= 0) return '';

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  return `${diffMins} min${diffMins > 1 ? 's' : ''}`;
};

const calculateEndTime = (startTime) => {
  if (!startTime) return '';
  const [h, m] = startTime.split(':').map(Number);
  const endH = (h + 1) % 24; 
  return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const getDefaultDueDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T20:00`;
};

const formatTaskTitle = (title) => {
  if (!title) return '';
  let formatted = title.toLowerCase().split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return formatted.replace(/\bhw\b/ig, 'HW');
};

const capitalizeName = (name) => {
  if (!name) return '';
  return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function AdminDashboard() {
  // Navigation & Data State
  const { user } = useContext(AuthContext);
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'dashboard'; 
  const [students, setStudents] = useState([]);
  const [homeworks, setHomeworks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [minDateTime, setMinDateTime] = useState('');
  const [selectedStudentForChart, setSelectedStudentForChart] = useState('all');
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({ content: '', targetAudience: '', imageUrl: '' });
  const [isAnnounceUploading, setIsAnnounceUploading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const [yearGroupAssign, setYearGroupAssign] = useState('all');
  const [yearGroupAllocate, setYearGroupAllocate] = useState('all');
  const [selectedStudentsToAllocate, setSelectedStudentsToAllocate] = useState([]);

const [editHomeworkId, setEditHomeworkId] = useState(null); 
const [assignForm, setAssignForm] = useState({
  title: '', weekNo: '', topic: '', type: 'File', studentId: '', difficulty: 'Medium', 
  dueDate: getDefaultDueDate(), fileUrl: '', attachments: [], content: '', studentInstructions: '',
  mcqs: [{ question: '', options: ['', '', '', ''], correctOption: 0 }]
});
const [testForm, setTestForm] = useState({
  title: '', weekNo: '', topic: '', type: 'File', studentId: '', difficulty: 'Easy', 
  startDate: '', dueDate: '', fileUrl: '', attachments: [], content: '', studentInstructions: '',
  mcqs: [{ question: '', options: ['', '', '', ''], correctOption: 0 }]
});
  const [testYearGroupAssign, setTestYearGroupAssign] = useState('all');
  const [testFileName, setTestFileName] = useState('');

  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState(null);

  // State for optional answer sheet upload
  const [answerSheet, setAnswerSheet] = useState({ fileUrl: '', fileName: '', attachments: [], isUploading: false });
  const [adminSubmitForm, setAdminSubmitForm] = useState({ answerText: '', answerFileUrl: '', attachments: [] });
  const [adminSubmitFile, setAdminSubmitFile] = useState({ fileName: '', isUploading: false });

  // Custom UI States
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [modal, setModal] = useState({ type: null, hwId: null, studentId: null, data: '' }); 
  const [isLoading, setIsLoading] = useState(true); 

  // Admin Profile & Settings State
  const [adminProfile, setAdminProfile] = useState({ name: 'Mentor', profilePic: '' });
  const [settingsForm, setSettingsForm] = useState({ name: '', profilePic: '', studentToDelete: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' }); 
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const togglePassword = (field) => setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  const [editStudentForm, setEditStudentForm] = useState({ id: '', name: '', phone: '', schoolName: '', city: '' });
  const [isProfileUploading, setIsProfileUploading] = useState(false);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [userId, setUserId] = useState(null); 

  // HANDLER FUNCTION
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return showToast("New passwords do not match!", "error");
    }
    try {
      await api.put('/auth/profile/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      showToast("Password updated successfully!");
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update password", "error");
    }
  };

  // Chat States
  const [messages, setMessages] = useState([]);
  const [selectedStudentForChat, setSelectedStudentForChat] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [parentStatuses, setParentStatuses] = useState({}); 
  const [isCheckingParents, setIsCheckingParents] = useState(false);
  
  // Chat Resizer States
  const [chatSidebarWidth, setChatSidebarWidth] = useState(33); 
  const [isChatDragging, setIsChatDragging] = useState(false);
  const chatContainerRef = React.useRef(null);

  // Study Library States
  const [resources, setResources] = useState([]);
  const [resourceForm, setResourceForm] = useState({ title: '', description: '', type: 'Document', url: '', targetAudience: '', yearGroupFilter: 'all' });
  const [isResourceUploading, setIsResourceUploading] = useState(false);

  // Scheme of Work States
  const [schemes, setSchemes] = useState([]);
  const [schemeForm, setSchemeForm] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    startTime: '', 
    endTime: '', 
    title: '', 
    weekNo: '', 
    topic: '', 
    description: '', 
    classStatus: 'Class Taken', 
    waitingTime: '', 
    rescheduledDate: '',
    rescheduledStartTime: '',
    rescheduledEndTime: '',
    yearGroupFilter: 'all', 
    studentId: '' 
  });
  const [graderInstruction, setGraderInstruction] = useState('');
  const [schemeListYear, setSchemeListYear] = useState('all');
  const [schemeListStudent, setSchemeListStudent] = useState('all');
  const [schemeListStatus, setSchemeListStatus] = useState('all'); 
  const [schemeListDate, setSchemeListDate] = useState(''); 

  // NEW STATES FOR EDITING BOARD AND SCHEMES
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [editBoardName, setEditBoardName] = useState('');
  const [editingSchemeId, setEditingSchemeId] = useState(null);
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);

  const [chatTarget, setChatTarget] = useState('student'); 
  const [selectedParent, setSelectedParent] = useState(null); 

  // Shared Drive States
  const [driveLinks, setDriveLinks] = useState([]);
  const [driveForm, setDriveForm] = useState({ title: '', url: '', targetAudience: '', yearGroupFilter: 'all' });

  const [graders, setGraders] = useState([]);
  const [newGraderEmail, setNewGraderEmail] = useState('');
  const [newGraderName, setNewGraderName] = useState('');

  const [pendingStudents, setPendingStudents] = useState([]);

  // Class Planner States
  const [plannerSessions, setPlannerSessions] = useState([]);
  const [plannerFilter, setPlannerFilter] = useState('calendar'); 
  const [plannerCurrentDate, setPlannerCurrentDate] = useState(new Date());
  const [plannerModal, setPlannerModal] = useState({ show: false, selectedDate: null, data: null });
  const [plannerForm, setPlannerForm] = useState({ topic: '', weekNo: '', title: '', startTime: '', endTime: '', isRecurring: false, yearGroupFilter: 'all', studentId: '' });

  // Topic Progress Tracker States
  const [topics, setTopics] = useState([]);
  const [topicForm, setTopicForm] = useState({ topicName: '', areaName: '', grade: '', yearLevel: '', sparxCode: '', pastPaperQues: '', flashCards: '', studentConfidence: '', datesCovered: [''] });
  
  // Restored Topic States
  const [topicYearFilter, setTopicYearFilter] = useState('all');
  const [topicSelectedStudent, setTopicSelectedStudent] = useState('');
  const [topicSearchTerm, setTopicSearchTerm] = useState('');
  const [topicSortConfig, setTopicSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // Homework Filter States
  const [hwYearFilter, setHwYearFilter] = useState('all');
  const [hwStudentFilter, setHwStudentFilter] = useState('all');
  const [hwStatusFilter, setHwStatusFilter] = useState('all');
  const [hwSortConfig, setHwSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  const handleSortHomework = (key) => {
    let direction = 'asc';
    if (hwSortConfig.key === key && hwSortConfig.direction === 'asc') direction = 'desc';
    setHwSortConfig({ key, direction });
  };
  
  const [topicGradeFilter, setTopicGradeFilter] = useState('all'); 
  const [topicYearLevelFilter, setTopicYearLevelFilter] = useState('all');
  const [selectedTopicIds, setSelectedTopicIds] = useState([]); 
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]); 
  
  // NEW: States for the Topic Modal and Editing
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);

  const [feedbackForm, setFeedbackForm] = useState({ feature: 'Dashboard', message: '', rating: 5 });
  const [allFeedback, setAllFeedback] = useState([]);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  const fetchPendingStudents = async () => {
    if (user?.role === 'admin') {
      try {
        const res = await api.get('/admin/students/pending');
        setPendingStudents(res.data);
      } catch (error) {
        console.error("Error fetching pending students", error);
      }
    }
  };

  const handleUpdateBoard = async (studentId) => {
    try {
      await api.put(`/admin/students/${studentId}/board`, { boardName: editBoardName });
      showToast("Board name updated successfully!");
      setEditingBoardId(null);
      fetchData();
    } catch(err) {
      showToast("Failed to update board", "error");
    }
  };

  const handleApproveStudent = async (studentId) => {
    try {
      await api.put(`/admin/students/${studentId}/approve`);
      showToast('Student approved successfully!');
      fetchPendingStudents(); 
      fetchData(); 
    } catch (error) {
      showToast('Failed to approve student', 'error');
    }
  };

  const handleRejectStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to reject this student's registration?")) return;
    try {
      await api.put(`/admin/students/${studentId}/reject`);
      showToast('🚫 Student registration rejected.', 'error');
      fetchPendingStudents(); 
      fetchData(); 
    } catch (error) {
      showToast('Failed to reject student', 'error');
    }
  };

  useEffect(() => {
    fetchData();
    fetchProfile(); 
    fetchDriveLinks();
    fetchPendingStudents();
    fetchTopics();

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

  const fetchTopics = async () => {
    try {
      const res = await api.get('/topics');
      setTopics(res.data);
    } catch (e) { console.error("Error fetching topics"); }
  };

  const fetchProfile = async () => {
    setIsLoading(true); 
    try {
      const res = await api.get('/auth/profile');
      setAdminProfile({ name: res.data.name, profilePic: res.data.profilePic || '', authProvider: res.data.authProvider || 'local' });
      setSettingsForm(prev => ({ ...prev, name: res.data.name, profilePic: res.data.profilePic || '' }));
    } catch (error) {
      console.error("Error fetching profile from DB");
    } finally {
      setIsLoading(false); 
    }
  };

  const fetchData = async () => {
    const processStudents = (data) => data.map(s => ({
      ...s,
      originalName: s.name,
      name: s.adminOverrides?.name || s.name,
      registrationName: s.adminOverrides?.name || s.registrationName || s.name,
      email: s.email, 
      phone: s.adminOverrides?.phone || s.phone,
      schoolName: s.adminOverrides?.schoolName || s.schoolName,
      city: s.adminOverrides?.city || s.city,
      yearGroup: s.yearGroup, 
    }));

    try {
      if (user?.role === 'admin') {
        const [studentRes, hwRes, annRes, resRes, graderRes, schemeRes, plannerRes, feedbackRes] = await Promise.all([
          api.get('/admin/students').catch(err => { console.error('Students error:', err); return { data: [] }; }),
          api.get('/homework/admin').catch(err => { console.error('Homework error:', err); return { data: [] }; }),
          api.get('/announcements/admin').catch(err => { console.error('Announcements error:', err); return { data: [] }; }),
          api.get('/resources').catch(err => { console.error('Resources error:', err); return { data: [] }; }),
          api.get('/admin/graders').catch(err => { console.error('Graders error:', err); return { data: [] }; }),
          api.get('/scheme').catch(err => { console.error('Scheme error:', err); return { data: [] }; }),
          api.get('/planner').catch(err => { console.error('Planner error:', err); return { data: [] }; }),
          api.get('/feedback').catch(err => { console.error('Feedback error:', err); return { data: [] }; })
        ]);
        
        setStudents(processStudents(studentRes.data)); 
        setHomeworks(hwRes.data); 
        setAnnouncements(annRes.data);
        setResources(resRes.data); 
        setGraders(graderRes.data); 
        setSchemes(schemeRes.data); 
        setPlannerSessions(plannerRes.data || []);
        setAllFeedback(feedbackRes.data);
        
      } else if (user?.role === 'grader') {
        const [studentRes, hwRes, schemeRes] = await Promise.all([
          api.get('/admin/students').catch(err => { console.error('Students error:', err); return { data: [] }; }), 
          api.get('/homework/admin').catch(err => { console.error('Homework error:', err); return { data: [] }; }), 
          api.get('/scheme').catch(err => { console.error('Scheme error:', err); return { data: [] }; })
        ]);
        setStudents(processStudents(studentRes.data)); 
        setHomeworks(hwRes.data); 
        setSchemes(schemeRes.data);
      }
    } catch (error) {
      showToast("Error fetching dashboard data.", "error");
    }
  };
  

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackForm.message) return showToast("Feedback message is required", "error");
    try {
      await api.post('/feedback', feedbackForm);
      showToast("Feedback submitted successfully! Thank you.");
      setFeedbackForm({ feature: 'Dashboard', message: '' });
      fetchData(); 
    } catch (err) {
      showToast("Failed to submit feedback", "error");
    }
  };
  const fetchDriveLinks = async () => {
    try {
      const res = await api.get('/drive-links');
      setDriveLinks(res.data);
    } catch (e) { console.error("Error fetching drive links"); }
  };

  const handleDriveSubmit = async (e) => {
    e.preventDefault();
    if (!driveForm.targetAudience || driveForm.targetAudience === 'all') return showToast("Please select a specific student!", "error");
    if (!driveForm.url.includes('http')) return showToast("Please provide a valid URL starting with http", "error");
    try {
      await api.post('/drive-links', driveForm);
      showToast("☁️ Drive Link Shared Successfully!");
      setDriveForm({ title: '', url: '', targetAudience: '', yearGroupFilter: 'all' });
      fetchDriveLinks();
    } catch (err) { showToast("Failed to share link", "error"); }
  };

  const handleDeleteDriveLink = async (id) => {
    try {
      await api.delete(`/drive-links/${id}`);
      showToast("Drive link removed", "error");
      fetchDriveLinks();
    } catch(e) { showToast("Failed to delete link", "error"); }
  };
  const handlePlannerSubmit = async (e) => {
    e.preventDefault();
    if (!plannerForm.startTime || !plannerForm.endTime) {
      return showToast("Please fill both Start and End time", "error");
    }
    if (!plannerForm.studentId || plannerForm.studentId === 'all') return showToast("Please select a specific student!", "error");

    const startDateTime = new Date(`${plannerModal.selectedDate}T${plannerForm.startTime}`);
    const endDateTime = new Date(`${plannerModal.selectedDate}T${plannerForm.endTime}`);

    try {
      if (plannerModal.data) {
        await api.put(`/planner/${plannerModal.data._id}`, {
          topic: plannerForm.topic || 'Class Session',
          weekNo: plannerForm.weekNo || '',
          title: plannerForm.title || 'Class Session',
          startDate: startDateTime,
          endDate: endDateTime,
          yearGroupFilter: plannerForm.yearGroupFilter,
          studentId: plannerForm.studentId
        });
        showToast('Class updated successfully!');
      } else {
        await api.post('/planner', {
          topic: 'Class Session', 
          weekNo: '',
          title: 'Class Session',
          startDate: startDateTime,
          endDate: endDateTime,
          isRecurring: plannerForm.isRecurring,
          yearGroupFilter: plannerForm.yearGroupFilter,
          studentId: plannerForm.studentId
        });
        showToast('Class scheduled successfully!');
      }
      setPlannerModal({ show: false, selectedDate: null, data: null });
      setPlannerForm({ topic: '', weekNo: '', title: '', startTime: '', endTime: '', isRecurring: false, yearGroupFilter: 'all', studentId: '' });
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error scheduling class.', "error");
    }
  };

  const handlePlannerDelete = async (id, deleteAllRecurring = false) => {
    try {
      await api.delete(`/planner/${id}?deleteAllRecurring=${deleteAllRecurring}`);
      showToast('Class deleted successfully!', 'error');
      setPlannerModal({ show: false, selectedDate: null, data: null });
      fetchData();
    } catch (err) {
      showToast('Error deleting class.', 'error');
    }
  };

  const handleResourceFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50000000) return showToast("File too large (Max 50MB)", "error");
    
    setIsResourceUploading(true);
    
    const formData = new FormData();
    formData.append('files', file);

    try {
      const res = await api.post('/upload?folder=study_materials', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      setResourceForm({ ...resourceForm, url: res.data.attachments[0].url });
    } catch (err) {
      showToast("Upload failed", "error");
    }
    
    setIsResourceUploading(false);
    e.target.value = null;
  };

  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    if (!resourceForm.targetAudience || resourceForm.targetAudience === 'all') return showToast("Please select a specific student!", "error");
    if (!resourceForm.url) return showToast("Please provide a file or link", "error");
    try {
      await api.post('/resources', resourceForm);
      showToast("Library Resource Added!");
      setResourceForm({ title: '', description: '', type: 'Document', url: '', targetAudience: '', yearGroupFilter: 'all' });
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

  const handleAnnounceImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Increased limit to 50MB for AWS S3
    if (file.size > 50000000) return showToast("Image too large (Max 50MB)", "error");
    
    setIsAnnounceUploading(true);
    
    const formData = new FormData();
    formData.append('files', file);

    try {
      const res = await api.post('/upload?folder=announcements', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      // Grab the single S3 URL returned by the backend
      setAnnouncementForm({ ...announcementForm, imageUrl: res.data.attachments[0].url });
    } catch (err) {
      showToast("Upload failed", "error");
    }
    
    setIsAnnounceUploading(false);
    e.target.value = null;
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (!announcementForm.targetAudience || announcementForm.targetAudience === 'all') return showToast("Please select a specific student!", "error");
    if (!announcementForm.content) return showToast("Message content is required", "error");
    try {
      await api.post('/announcements', announcementForm);
      showToast("📢 Announcement Broadcasted Successfully!");
      setAnnouncementForm({ content: '', targetAudience: '', imageUrl: '' });
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
  const handleDeleteFeedback = async (id) => {
    try {
      await api.delete(`/feedback/${id}`);
      showToast("Feedback removed", "error");
      fetchData();
    } catch(e) {
      showToast("Failed to delete feedback", "error");
    }
  };
  const handleMarkFeedbackReviewed = async (fb) => {
    try {
      await api.put(`/feedback/${fb._id}/review`);
      if (fb.user?._id) {
        await api.post('/messages', { 
          receiverId: fb.user._id, 
          content: `Hello! Thank you for contributing to MathCom Mentors. The Admin team has successfully reviewed your feedback regarding "${fb.feature}" (rated ${fb.rating}★). We highly appreciate your input in making the platform better!` 
        });
      }
      showToast("Feedback marked as reviewed & automated thank you message sent!");
      fetchData(); 
    } catch(e) {
      showToast("Failed to mark feedback as reviewed", "error");
    }
  };
  const fetchMessages = async (studentId) => {
    try {
      const res = await api.get(`/messages/${studentId}`);
      setMessages(res.data);
    } catch (e) { console.error("Error fetching messages"); }
  };

  useEffect(() => {
    if (activeTab === 'messages' && user?.role === 'admin') {
      const checkAllParents = async () => {
        if (isCheckingParents || students.length === 0) return;
        setIsCheckingParents(true);
        const statuses = { ...parentStatuses };
        const unchecked = students.filter(s => statuses[s._id] === undefined);
        
        for (let i = 0; i < unchecked.length; i += 5) {
          const batch = unchecked.slice(i, i + 5);
          await Promise.all(batch.map(async (student) => {
            try {
              const res = await api.get(`/admin/student/${student._id}/parent`);
              statuses[student._id] = !!res.data;
            } catch (err) {
              statuses[student._id] = false;
            }
          }));
          setParentStatuses({ ...statuses }); 
        }
      };
      checkAllParents();
    }
  }, [activeTab, students]);

  // Chat Resizer Event Listeners
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isChatDragging || !chatContainerRef.current) return;
      const containerRect = chatContainerRef.current.getBoundingClientRect();
      
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      if (newWidth >= 20 && newWidth <= 55) { 
        setChatSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsChatDragging(false);
      document.body.style.userSelect = 'auto'; 
    };

    if (isChatDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; 
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'auto';
    };
  }, [isChatDragging]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedStudentForChat) return;

    const targetId = chatTarget === 'parent' && selectedParent
      ? selectedParent._id
      : selectedStudentForChat._id;

    try {
      await api.post('/messages', { receiverId: targetId, content: chatInput });
      setChatInput('');
      fetchMessages(targetId || 'admin'); 
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

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentSize = assignForm.attachments.reduce((acc, curr) => acc + (curr.size || 0), 0);
    const newFilesSize = files.reduce((acc, file) => acc + file.size, 0);

    if (currentSize + newFilesSize > 50000000) { 
      return showToast("Total combined size of all attachments cannot exceed 50MB!", "error");
    }

    setIsUploading(true);
    
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const res = await api.post('/upload?folder=homeworks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setAssignForm(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...res.data.attachments]
      }));
    } catch (err) {
      showToast("File upload failed.", "error");
    }

    setIsUploading(false);
    e.target.value = null; 
  };

  const handleAnswerSheetUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentSize = (answerSheet.attachments || []).reduce((acc, curr) => acc + (curr.size || 0), 0);
    const newFilesSize = files.reduce((acc, file) => acc + file.size, 0);

    if (currentSize + newFilesSize > 50000000) {
      return showToast("Total combined size of all attachments cannot exceed 50MB!", "error");
    }

    setAnswerSheet(prev => ({ ...prev, isUploading: true }));
    
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const res = await api.post('/upload?folder=marked_work', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAnswerSheet(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...res.data.attachments],
        isUploading: false
      }));
    } catch (err) {
      setAnswerSheet(prev => ({ ...prev, isUploading: false }));
      showToast("Upload failed", "error");
    }
    e.target.value = null;
  };

  const handleAdminSubmitFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentSize = (adminSubmitForm.attachments || []).reduce((acc, curr) => acc + (curr.size || 0), 0);
    const newFilesSize = files.reduce((acc, file) => acc + file.size, 0);

    if (currentSize + newFilesSize > 50000000) {
      return showToast("Total combined size of all attachments cannot exceed 50MB!", "error");
    }

    setAdminSubmitFile(prev => ({ ...prev, isUploading: true }));
    
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const res = await api.post('/upload?folder=submissions', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAdminSubmitForm(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...res.data.attachments]
      }));
    } catch (err) {
      showToast("Upload failed", "error");
    }
    
    setAdminSubmitFile(prev => ({ ...prev, isUploading: false }));
    e.target.value = null;
  };

const handleAssignSubmit = async (e) => {
  e.preventDefault();
  if (!assignForm.studentId || assignForm.studentId === 'all') return showToast("Please select a specific student!", "error");
  if (!assignForm.dueDate) return showToast("Please assign a valid Due Date!", "error");

  try {
    if (editHomeworkId) {
        await api.put(`/homework/${editHomeworkId}`, assignForm);
        showToast('🎉 Homework successfully updated!');
        setEditHomeworkId(null);
    } else {
        await api.post('/homework/assign', assignForm);
        showToast('🎉 Homework successfully published!');
    }
    fetchData(); 
    setAssignForm({ ...assignForm, title: '', weekNo: '', topic: '', fileUrl: '', attachments: [], content: '', studentInstructions: '', mcqs: [{ question: '', options: ['', '', '', ''], correctOption: 0 }] });
    setIsAssignModalOpen(false); 
  } catch (err) {
    showToast(err.response?.data?.message || 'Error assigning/updating work.', "error");
  }
};

  const updateMcq = (index, field, value, optionIndex = null) => {
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

  const addMcq = () => {
    setAssignForm({
      ...assignForm,
      mcqs: [...assignForm.mcqs, { question: '', options: ['', '', '', ''], correctOption: 0 }]
    });
  };

  const handleTestFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const currentSize = testForm.attachments.reduce((acc, curr) => acc + (curr.size || 0), 0);
    const newFilesSize = files.reduce((acc, file) => acc + file.size, 0);

    if (currentSize + newFilesSize > 50000000) {
      return showToast("Total combined size of all attachments cannot exceed 50MB!", "error");
    }

    setIsUploading(true);
    
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const res = await api.post('/upload?folder=tests', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setTestForm(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...res.data.attachments]
      }));
    } catch (err) {
      showToast("Upload failed", "error");
    }
    
    setIsUploading(false);
    e.target.value = null;
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

  const executeModalAction = async () => {
    try {
      if (modal.type === 'grade') {
        const hasScores = modal.data.score !== '' && modal.data.totalScore !== '';
        const hasAttachments = answerSheet.fileUrl || (answerSheet.attachments && answerSheet.attachments.length > 0);
        
        if (!hasScores && !hasAttachments) {
          return showToast("Enter marks or attach marked work!", "error");
        }

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
        
        await api.put(`/homework/${modal.hwId}/grade`, { 
          score: modal.data.score !== '' ? Number(modal.data.score) : null, 
          totalScore: modal.data.totalScore !== '' ? Number(modal.data.totalScore) : null, 
          feedback: modal.data.feedback || '',
          adminAnswerSheetUrl: answerSheet.fileUrl,
          adminAttachments: answerSheet.attachments,
          driveLink: modal.data.driveLink 
        });
        
        showToast("Homework Graded/Updated Successfully!");
      }
      else if (modal.type === 'extend') {
        if (!modal.data) return showToast("Select a valid date!", "error");
        await api.put(`/homework/${modal.hwId}/extend`, { newDueDate: modal.data });
        showToast("Deadline Extended!");
      } 
      else if (modal.type === 'delete') {
        await api.delete(`/homework/${modal.hwId}`);
        showToast("Homework Deleted.", "error"); 
      }
      else if (modal.type === 'deleteStudent') {
        await api.delete(`/admin/students/${modal.studentId}`);
        showToast("Student Removed Successfully.", "error");
      }
      else if (modal.type === 'deleteAnsSheet') {
        await api.put(`/homework/${modal.hwId}/grade`, { 
          score: modal.data.score != null ? Number(modal.data.score) : null, 
          totalScore: modal.data.totalScore != null ? Number(modal.data.totalScore) : null,
          adminAnswerSheetUrl: '',
          adminAttachments: []
        });
        showToast("Marked Work Removed!");
      }
      else if (modal.type === 'deleteGrader') {
        await api.delete(`/admin/graders/${modal.graderId}`);
        setGraders(graders.filter(g => g._id !== modal.graderId));
        showToast("Grader deleted successfully!");
      }
      else if (modal.type === 'allocate') {
        await api.put(`/admin/graders/${modal.graderId}/allocate`, { studentIds: selectedStudentsToAllocate });
        showToast("Students successfully allocated to grader!");
      }
      else if (modal.type === 'graderInstruction') {
        if (editingSchemeId) {
          await api.put(`/scheme/${editingSchemeId}`, { ...schemeForm, graderInstruction });
          showToast("Report Updated successfully!");
          setEditingSchemeId(null);
        } else {
          await api.post('/scheme', { ...schemeForm, graderInstruction });
          showToast("Daily Report Submitted!");
        }
        setSchemeForm({ date: new Date().toISOString().split('T')[0], startTime: '', endTime: '', title: '', weekNo: '', topic: '', description: '', classStatus: 'Class Taken', yearGroupFilter: 'all', studentId: '' });
        setGraderInstruction('');
        setIsSchemeModalOpen(false);
      }
      else if (modal.type === 'deleteScheme') {
        await api.delete(`/scheme/${modal.hwId}`);
        showToast("Report deleted successfully!", "error");
      }
      else if (modal.type === 'deleteAllSchemes') {
        await api.delete(`/scheme`);
        showToast("All reports have been deleted!", "error");
      }
      else if (modal.type === 'deleteAllTopics') {
        const query = modal.data ? `?studentId=${modal.data}` : '';
        await api.delete(`/topics${query}`);
        showToast(modal.data ? "Student's topics deleted successfully!" : "All topics have been deleted!", "error");
        fetchTopics();
      }
      else if (modal.type === 'adminSubmit') {
        await api.post(`/homework/${modal.hwId}/submit`, {
          answerText: adminSubmitForm.answerText,
          answerFileUrl: adminSubmitForm.answerFileUrl,
          attachments: adminSubmitForm.attachments || []
        });
        showToast("Homework submitted successfully on behalf of the student!");
        setAdminSubmitForm({ answerText: '', answerFileUrl: '', attachments: [] });
        setAdminSubmitFile({ fileName: '', isUploading: false });
      }
      
      setModal({ type: null, hwId: null, studentId: null, data: '' });
      setAnswerSheet({ fileUrl: '', fileName: '', attachments: [], isUploading: false });
      fetchData();
    } catch (error) {
      showToast(error.response?.data?.message || "Action failed.", "error");
    }
  };
  
  const handleSchemeInitialSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return; 
    if (!schemeForm.studentId || schemeForm.studentId === 'all') return showToast("Please select a specific student!", "error");

    let shouldShowGraderBox = false;

    if (schemeForm.classStatus === 'Class Taken' && graders.length > 0) {
      if (schemeForm.studentId === 'all') {
        shouldShowGraderBox = true; 
      } else {
        
        const isAllocated = graders.some(g => 
          g.allocatedStudents?.some(s => s._id === schemeForm.studentId || s === schemeForm.studentId)
        );
        if (isAllocated) {
          shouldShowGraderBox = true;
        }
      }
    }

    if (shouldShowGraderBox) {
      setIsSchemeModalOpen(false); 
      setModal({ type: 'graderInstruction', data: '' });
    } else {
      await executeSchemeSubmitDirect();
    }
  };

  const executeSchemeSubmitDirect = async () => {
    try {
      setIsLoading(true);
      if (editingSchemeId) {
        await api.put(`/scheme/${editingSchemeId}`, { 
          ...schemeForm, 
          graderInstruction: graderInstruction || '' 
        });
        showToast("Report Updated successfully!");
        setEditingSchemeId(null);
      } else {
        await api.post('/scheme', { 
          ...schemeForm, 
          graderInstruction: graderInstruction || '' 
        });
        showToast("Daily Report Submitted!");
      }
      setSchemeForm({ date: new Date().toISOString().split('T')[0], startTime: '', endTime: '', title: '', weekNo: '', topic: '', description: '', classStatus: 'Class Taken', yearGroupFilter: 'all', studentId: 'all' });
      setGraderInstruction('');
      setModal({ type: null });
      setIsSchemeModalOpen(false);
      fetchData(); 
    } catch(err) { 
      showToast("Error submitting/updating report", "error"); 
    } finally {
      setIsLoading(false);
    }
  };

  // Topic Handlers
  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    const validDates = topicForm.datesCovered.filter(d => d.trim() !== '');
    if (!topicSelectedStudent) return showToast("Please select a student from the main page first.", "error");
    
    const payload = {
      topicName: topicForm.topicName,
      areaName: topicForm.areaName,
      grade: topicForm.grade,
      yearLevel: topicForm.yearLevel,
      sparxCode: topicForm.sparxCode,
      pastPaperQues: topicForm.pastPaperQues,
      flashCards: topicForm.flashCards,
      studentConfidence: topicForm.studentConfidence,
      datesCovered: validDates,
      studentId: topicSelectedStudent
    };

    try {
      if (editingTopicId) {
        await api.put(`/topics/${editingTopicId}`, payload);
        showToast("Topic progress updated successfully!");
      } else {
        await api.post('/topics', payload);
        showToast("Topic progress saved successfully!");
      }
      setIsTopicModalOpen(false);
      setEditingTopicId(null);
      setTopicForm({ topicName: '', areaName: '', grade: '', yearLevel: '', sparxCode: '', pastPaperQues: '', flashCards: '', studentConfidence: '', datesCovered: [''] });
      fetchTopics();
    } catch(err) { 
      console.error("Save Topic Error:", err);
      showToast(err.response?.data?.message || "Failed to save topic (Check Console)", "error"); 
    }
  };

  const handleEditTopic = (topic) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setTopicForm({
      topicName: topic.topicName,
      areaName: topic.areaName,
      grade: topic.grade,
      yearLevel: topic.yearLevel || '',
      sparxCode: topic.sparxCode || '',
      pastPaperQues: topic.pastPaperQues || '',
      flashCards: topic.flashCards || '',
      studentConfidence: topic.studentConfidence || '',
      datesCovered: topic.datesCovered.length > 0 ? topic.datesCovered : [todayStr]
    });
    setTopicSelectedStudent(topic.studentId ? (topic.studentId._id || topic.studentId) : '');
    setEditingTopicId(topic._id);
    setIsTopicModalOpen(true);
  };

  const handleDeleteTopic = async (id) => {
    try {
      await api.delete(`/topics/${id}`);
      showToast("Topic record deleted", "error");
      fetchTopics();
    } catch(err) { showToast("Failed to delete", "error"); }
  };

  const handleSortTopics = (key) => {
    let direction = 'asc';
    if (topicSortConfig.key === key && topicSortConfig.direction === 'asc') direction = 'desc';
    setTopicSortConfig({ key, direction });
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!topicSelectedStudent) return showToast("Please select a student first!", "error");

    setIsUploadingCSV(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text.split('\n');
      
      if (rows.length < 2) {
        setIsUploadingCSV(false);
        return showToast("CSV file appears to be empty.", "error");
      }

      const parseCSVRow = (str) => {
        let result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < str.length; i++) {
          if (str[i] === '"') inQuotes = !inQuotes;
          else if (str[i] === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
          else current += str[i];
        }
        result.push(current.trim());
        return result.map(s => s.replace(/(^"|"$)/g, ''));
      };

      const headers = parseCSVRow(rows[0]).map(h => h.toLowerCase());
      const areaIdx = headers.findIndex(h => h.includes('area'));
      const topicIdx = headers.findIndex(h => h.includes('topic'));
      const gradeIdx = headers.findIndex(h => h.includes('grade'));
      const yearIdx = headers.findIndex(h => h.includes('year'));
      const sparxIdx = headers.findIndex(h => h.includes('sparx'));
      const pastPaperIdx = headers.findIndex(h => h.includes('past paper'));
      const flashcardIdx = headers.findIndex(h => h.includes('flashcard'));

      if (areaIdx === -1 && topicIdx === -1 && gradeIdx === -1 && sparxIdx === -1 && pastPaperIdx === -1 && flashcardIdx === -1) {
        setIsUploadingCSV(false);
        return showToast("CSV must contain valid headers (Area, Topic, Grade, Year, Sparx, Past Papers, or Flashcards).", "error");
      }

      const topicsToUpload = [];
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        const cleanRow = parseCSVRow(rows[i]);

        const tName = topicIdx !== -1 ? cleanRow[topicIdx] : '';
        const aName = areaIdx !== -1 ? cleanRow[areaIdx] : '';
        const gName = gradeIdx !== -1 ? cleanRow[gradeIdx] : '';
        const yLevel = yearIdx !== -1 ? cleanRow[yearIdx] : '';
        const sCode = sparxIdx !== -1 ? cleanRow[sparxIdx] : '';
        const ppQues = pastPaperIdx !== -1 ? cleanRow[pastPaperIdx] : '';
        const fCards = flashcardIdx !== -1 ? cleanRow[flashcardIdx] : '';

        if (tName || aName || gName) {
          topicsToUpload.push({
            areaName: aName || '', 
            topicName: tName || 'Untitled Topic',
            grade: gName || 'N/A',
            yearLevel: yLevel || '',
            sparxCode: sCode || '',
            pastPaperQues: ppQues || '',
            flashCards: fCards || '',
            studentConfidence: '',
            datesCovered: [],
            studentId: topicSelectedStudent
          });
        }
      }

      if (topicsToUpload.length === 0) {
        setIsUploadingCSV(false);
        return showToast("No valid topics found in CSV.", "error");
      }

      try {
        await api.post('/topics/bulk', { topics: topicsToUpload });
        showToast(`Successfully uploaded ${topicsToUpload.length} topics!`);
        fetchTopics();
      } catch (err) {
        showToast("Failed to upload topics.", "error");
      }
      setIsUploadingCSV(false);
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  const processedTopics = !topicSelectedStudent ? [] : (topics || [])
    .filter(t => {
       if (topicSelectedStudent && t.studentId?._id !== topicSelectedStudent) return false;
       if (topicGradeFilter !== 'all' && t.grade !== topicGradeFilter) return false; 
       if (topicYearLevelFilter !== 'all' && t.yearLevel !== topicYearLevelFilter) return false; 
       
       return (t.topicName || '').toLowerCase().includes(topicSearchTerm.toLowerCase()) ||
              (t.areaName || '').toLowerCase().includes(topicSearchTerm.toLowerCase()) ||
              (t.grade || '').toLowerCase().includes(topicSearchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (!topicSortConfig || !topicSortConfig.key) return 0;

      if (topicSortConfig.key === 'yearLevel') {
        const numA = parseInt((a.yearLevel || '').toString().replace(/[^0-9]/g, ''), 10) || 0;
        const numB = parseInt((b.yearLevel || '').toString().replace(/[^0-9]/g, ''), 10) || 0;
        if (numA < numB) return topicSortConfig.direction === 'asc' ? -1 : 1;
        if (numA > numB) return topicSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }

      if (topicSortConfig.key === 'sparxCode') {
        const valA = (a.sparxCode || '').toString();
        const valB = (b.sparxCode || '').toString();
        
        const compareResult = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
        
        return topicSortConfig.direction === 'asc' ? compareResult : -compareResult;
      }

      const valA = (a[topicSortConfig.key] || '').toString().toLowerCase();
      const valB = (b[topicSortConfig.key] || '').toString().toLowerCase();
      if (valA < valB) return topicSortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return topicSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const filteredHomeworks = homeworks.filter(hw => {
    if (hw.isTest) return false;
    if (hwYearFilter !== 'all') {
      const stuYear = hw.studentId?.yearGroup || '';
      if (stuYear !== hwYearFilter) return false;
    }
    if (hwStudentFilter !== 'all') {
      const stuId = hw.studentId?._id || hw.studentId;
      if (String(stuId) !== String(hwStudentFilter)) return false;
    }
    if (hwStatusFilter !== 'all') {
      if (hw.status !== hwStatusFilter) return false;
    }
    const searchLower = (searchTerm || '').toLowerCase();
    const titleMatch = (hw.title || '').toLowerCase().includes(searchLower);
    const nameMatch = (hw.studentId?.name || '').toLowerCase().includes(searchLower);
    const regNameMatch = (hw.studentId?.registrationName || '').toLowerCase().includes(searchLower);
    
    return titleMatch || nameMatch || regNameMatch;
  }).sort((a, b) => {
    if (!hwSortConfig || !hwSortConfig.key) return 0;
    
    let valA = '';
    let valB = '';

    if (hwSortConfig.key === 'title') {
      valA = (a.title || '').toLowerCase();
      valB = (b.title || '').toLowerCase();
    } else if (hwSortConfig.key === 'student') {
      valA = (a.studentId?.registrationName || a.studentId?.name || '').toLowerCase();
      valB = (b.studentId?.registrationName || b.studentId?.name || '').toLowerCase();
    } else if (hwSortConfig.key === 'dueDate') {
      valA = new Date(a.dueDate || 0).getTime();
      valB = new Date(b.dueDate || 0).getTime();
    } else if (hwSortConfig.key === 'status') {
      valA = (a.status || '').toLowerCase();
      valB = (b.status || '').toLowerCase();
    } else if (hwSortConfig.key === 'difficulty') {
      valA = (a.difficulty || '').toLowerCase();
      valB = (b.difficulty || '').toLowerCase();
    } else if (hwSortConfig.key === 'createdAt') {
      valA = new Date(a.createdAt || 0).getTime();
      valB = new Date(b.createdAt || 0).getTime();
    } else if (hwSortConfig.key === 'submissionTime') {
      valA = new Date(a.submission?.submittedAt || 0).getTime();
      valB = new Date(b.submission?.submittedAt || 0).getTime();
    }

        if (valA < valB) return hwSortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return hwSortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const activeHomeworks = filteredHomeworks.filter(hw => hw.status !== 'Graded');

  const filteredTests = homeworks.filter(hw => {
    if (!hw.isTest) return false;
    if (hwYearFilter !== 'all') {
      const stuYear = hw.studentId?.yearGroup || '';
      if (stuYear !== hwYearFilter) return false;
    }
    if (hwStudentFilter !== 'all') {
      const stuId = hw.studentId?._id || hw.studentId;
      if (String(stuId) !== String(hwStudentFilter)) return false;
    }
    if (hwStatusFilter !== 'all') {
      if (hw.status !== hwStatusFilter) return false;
    }
    const searchLower = (searchTerm || '').toLowerCase();
    const titleMatch = (hw.title || '').toLowerCase().includes(searchLower);
    const nameMatch = (hw.studentId?.name || '').toLowerCase().includes(searchLower);
    const regNameMatch = (hw.studentId?.registrationName || '').toLowerCase().includes(searchLower);
    
    return titleMatch || nameMatch || regNameMatch;
  }).sort((a, b) => {
    if (!hwSortConfig || !hwSortConfig.key) return 0;
    
    let valA = '';
    let valB = '';

    if (hwSortConfig.key === 'title') {
      valA = (a.title || '').toLowerCase();
      valB = (b.title || '').toLowerCase();
    } else if (hwSortConfig.key === 'student') {
      valA = (a.studentId?.registrationName || a.studentId?.name || '').toLowerCase();
      valB = (b.studentId?.registrationName || b.studentId?.name || '').toLowerCase();
    } else if (hwSortConfig.key === 'dueDate') {
      valA = new Date(a.startDate || 0).getTime();
      valB = new Date(b.startDate || 0).getTime();
    } else if (hwSortConfig.key === 'status') {
      valA = (a.status || '').toLowerCase();
      valB = (b.status || '').toLowerCase();
    } else if (hwSortConfig.key === 'difficulty') {
      valA = (a.difficulty || '').toLowerCase();
      valB = (b.difficulty || '').toLowerCase();
    }

    if (valA < valB) return hwSortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return hwSortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleProfilePicUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2000000) return showToast("Profile picture must be under 2MB", "error");
    
    // Save the actual file in state to upload LATER when they click Save
    setProfilePicFile(file);
    
    // Show a temporary local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setSettingsForm(prev => ({ ...prev, profilePic: reader.result }));
    };
    reader.readAsDataURL(file);
    
    e.target.value = null;
  };

  const handleSaveSettings = async () => {
    try {
      setIsProfileUploading(true);
      let finalProfilePicUrl = settingsForm.profilePic;

      // If a new file was selected, upload it to S3 NOW
      if (profilePicFile) {
        const formData = new FormData();
        formData.append('files', profilePicFile);

        const uploadRes = await api.post('/upload?folder=profiles', formData, { 
          headers: { 'Content-Type': 'multipart/form-data' } 
        });
        finalProfilePicUrl = uploadRes.data.attachments[0].url;
      }

      // Now save the profile with the final S3 URL
      const res = await api.put('/auth/profile', { 
        name: settingsForm.name, 
        profilePic: finalProfilePicUrl 
      });

      setAdminProfile({ name: res.data.user.name, profilePic: res.data.user.profilePic || '' });
      setSettingsForm(prev => ({ ...prev, profilePic: res.data.user.profilePic || '' }));
      setProfilePicFile(null);
      setIsProfileUploading(false);
      showToast("Profile Settings Saved!");
    } catch (error) {
      setIsProfileUploading(false);
      showToast("Failed to save profile", "error");
    }
  };

  const handleUpdateStudentDetails = async () => {
    if (!editStudentForm.id) return showToast("Please select a student first!", "error");
    try {
      await api.put(`/admin/students/${editStudentForm.id}`, editStudentForm);
      showToast("Student details updated successfully!");
      
      setEditStudentForm({ id: '', name: '', phone: '', schoolName: '', city: '' });
      fetchData(); 
    } catch (error) {
      showToast("Failed to update student", "error");
    }
  };
  const handleExportTopicsCSV = () => {
    if (processedTopics.length === 0) return showToast("No topics to export", "error");

    const headers = ["Area Name", "Topic Name", "Grade", "Year Level", "Sparx Codes", "Past Exam Qs", "Flash Cards", "Dates Covered", "Student Confidence Level"];
    
    const rows = processedTopics.map(topic => {
      const dates = topic.datesCovered
        .map(d => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }))
        .join(" | ");
      return `"${topic.areaName}","${topic.topicName}","${topic.grade}","${topic.yearLevel || ''}","${topic.sparxCode || ''}","${topic.pastPaperQues || ''}","${topic.flashCards || ''}","${dates}","${topic.studentConfidence || ''}"`;
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    let fileNameStr = `Topics_Covered_${new Date().toISOString().split('T')[0]}.csv`;
    if (topicSelectedStudent) {
      const st = students.find(s => s._id === topicSelectedStudent);
      if (st) {
        const firstName = (st.registrationName || st.name).split(' ')[0];
        const year = st.yearGroup || 'Year';
        fileNameStr = `${firstName}-${year}_Topics_${new Date().toISOString().split('T')[0]}.csv`;
      }
    }
    link.download = fileNameStr;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Topics successfully exported to CSV!");
  };

  const handleExportTopicsPDF = async () => { 
    if (processedTopics.length === 0) return showToast("No topics to export", "error");

    try {
      const doc = new jsPDF('landscape'); 
      
      doc.setFontSize(18);
      doc.text("Topics Covered Report", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      const tableColumn = ["Area", "Topic", "Grade", "Year", "Sparx Codes", "Past Exam Qs", "Flash Cards", "Dates", "Confidence"];
      const tableRows = [];

      processedTopics.forEach(topic => {
        const dates = topic.datesCovered
          .map(d => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }))
          .join(", ");
        
        tableRows.push([
          topic.areaName,
          topic.topicName,
          topic.grade,
          topic.yearLevel || '-',
          topic.sparxCode || '-',
          topic.pastPaperQues ? { content: 'Link Attached', url: topic.pastPaperQues } : '-',
          topic.flashCards ? { content: 'Link Attached', url: topic.flashCards } : '-',
          dates,
          topic.studentConfidence || '-'
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        didParseCell: (data) => {
          if (data.section === 'body' && (data.column.index === 5 || data.column.index === 6)) {
            if (data.cell.raw && data.cell.raw.url) {
              data.cell.styles.textColor = [37, 99, 235]; 
            }
          }
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && (data.column.index === 5 || data.column.index === 6)) {
            if (data.cell.raw && data.cell.raw.url) {
              doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: data.cell.raw.url });
            }
          }
        }
      });

      let fileNameStr = `Topics_Covered_${new Date().toISOString().split('T')[0]}.pdf`;
      if (topicSelectedStudent) {
        const st = students.find(s => s._id === topicSelectedStudent);
        if (st) {
          const firstName = (st.registrationName || st.name).split(' ')[0];
          const year = st.yearGroup || 'Year';
          fileNameStr = `${firstName}-${year}_Topics_${new Date().toISOString().split('T')[0]}.pdf`;
        }
      }
      doc.save(fileNameStr);
      showToast("Topics successfully exported to PDF!");
    } catch (error) {
      console.error("PDF Export Error:", error);
      showToast("Error generating PDF.", "error");
    }
  };
  const handleExportCSV = () => {
    if (students.length === 0) return showToast("No students to export", "error");

    const headers = ["Student Name", "Student ID", "Year Group", "Board Name", "School", "City", "Phone", "Email", "Completed Tasks", "Pending Review", "Average Score (%)"];
    
    const rows = students.map(student => {
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

      return `"${student.registrationName || student.name}","${student.studentId || 'N/A'}","${student.yearGroup || 'N/A'}","${student.boardName || 'N/A'}","${student.schoolName || 'N/A'}","${student.city || 'N/A'}","${student.phone || 'N/A'}","${student.email}",${completedCount},${pendingCount},${avgScore}`;
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
      const doc = new jsPDF('landscape'); 
      
      doc.setFontSize(18);
      doc.text("Student Performance Report", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      const tableColumn = ["Student Name", "ID", "Year", "Board", "School & City", "Phone", "Email", "Completed", "Pending", "Avg Score (%)"];
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

        const schoolDetails = [student.schoolName, student.city].filter(Boolean).join(', ') || 'N/A';

        tableRows.push([
          student.registrationName || student.name,
          student.studentId || 'N/A',
          student.yearGroup || 'N/A',
          student.boardName || 'N/A',
          schoolDetails, 
          student.phone || 'N/A', 
          student.email, 
          completedCount.toString(), 
          pendingCount.toString(), 
          `${avgScore}%`
        ]);
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

  const handleExportPlannerPDF = async () => {
    try {
      const doc = new jsPDF('landscape');
      doc.setFontSize(18);
      doc.text("Class Planner Schedule", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      let currentY = 40;

      const calendarElement = document.getElementById('planner-calendar-view');
      if (calendarElement && plannerFilter === 'calendar') {
        const canvas = await html2canvas(calendarElement, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        
        const pdfWidth = 265; 
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        doc.addImage(imgData, 'PNG', 15, currentY, pdfWidth, pdfHeight);
        
        doc.addPage();
        currentY = 20; 
      }

      let listToExport = [];
      const year = plannerCurrentDate.getFullYear();
      const month = plannerCurrentDate.getMonth();

      if (plannerFilter === 'day') {
        const today = new Date().toLocaleDateString();
        listToExport = plannerSessions.filter(s => new Date(s.startDate).toLocaleDateString() === today);
      } else if (plannerFilter === 'week') {
        const now = new Date();
        const first = now.getDate() - now.getDay();
        const firstDay = new Date(new Date().setDate(first));
        const lastDay = new Date(new Date().setDate(first + 6));
        listToExport = plannerSessions.filter(s => {
          const d = new Date(s.startDate);
          return d >= firstDay && d <= lastDay;
        });
      } else {
        listToExport = plannerSessions.filter(s => new Date(s.startDate).getMonth() === month && new Date(s.startDate).getFullYear() === year);
      }

      listToExport.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      const tableColumn = ["Date", "Time", "Lesson Topic", "Student / Audience", "Recurring"];
      const tableRows = [];

      listToExport.forEach(session => {
        const dateStr = new Date(session.startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = `${new Date(session.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(session.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        const studentName = session.studentId && session.studentId !== 'all' ? (students.find(s => s._id === session.studentId)?.registrationName || students.find(s => s._id === session.studentId)?.name || 'Unknown') : 'Entire Class';
        const recurring = session.isRecurring ? 'Yes' : 'No';

        tableRows.push([dateStr, timeStr, session.topic || '-', studentName, recurring]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
      });

      doc.save(`Class_Planner_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast("Planner successfully exported to PDF!");
    } catch (error) {
      console.error("PDF Export Error:", error);
      showToast("Error generating PDF.", "error");
    }
  };

  const handleExportAnalyticsPDF = async () => {
    const chartContainer = document.getElementById('analytics-export-area');
    if (!chartContainer) return showToast("No analytics data to export", "error");

    try {
      showToast("Generating PDF, please wait...", "success");
      
      const canvas = await html2canvas(chartContainer, { 
        scale: 2, 
        backgroundColor: '#ffffff',
        useCORS: true,
        scrollY: -window.scrollY
      });
      
      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('landscape', 'mm', 'a4'); 
      
      const pdfWidth = 270; 
      const pageHeight = 180; 
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 40; 

      doc.setFontSize(22);
      doc.setTextColor(27, 37, 89);
      doc.text("Class Performance & Analytics Report", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      doc.addImage(imgData, 'PNG', 14, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      // Automatically add new pages if the charts are too tall for one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 14, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      doc.save(`Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast("Analytics successfully exported to PDF!");
    } catch (error) {
      console.error("PDF Export Error:", error);
      showToast("Error generating PDF.", "error");
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

      {/* IMAGE VIEWER */}
      {fullScreenImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setFullScreenImage(null)}>
          <div className="relative inline-flex justify-center items-center">
            <button 
              className="absolute -top-4 -right-4 bg-white text-rose-500 hover:bg-rose-500 hover:text-white w-10 h-10 rounded-full flex items-center justify-center text-xl font-black shadow-xl transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setFullScreenImage(null); }}
            >
              ✕
            </button>
            <img 
              src={fullScreenImage} 
              alt="Full Screen Profile" 
              className="max-w-[90vw] max-h-[85vh] rounded-3xl object-contain shadow-2xl border-4 border-white/20"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}

      {modal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`bg-white rounded-[2rem] p-8 w-full shadow-2xl transform scale-100 animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar ${modal.type === 'viewWork' || modal.type === 'grade' ? 'max-w-3xl' : 'max-w-md'}`}>
            
            {modal.type === 'grade' && (
              <>
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <div className="bg-emerald-500 w-2 h-8 rounded-full"></div>
                  <h3 className="text-2xl font-black text-[#1B2559]">Grade Homework</h3>
                </div>
                <p className="text-slate-500 text-sm mb-6">Enter score and total marks below. You can optionally attach a marked document or a Google Drive link.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                  {/* Left Column: Scores */}
                  <div className="bg-[#F4F7FE] p-6 rounded-3xl border border-slate-100 flex flex-col justify-center items-center">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide mb-3">Score / Total</label>
                    <div className="flex items-center justify-center gap-4 w-full">
                      <input type="number" min="0" className="w-24 p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-black text-3xl text-center text-[#1B2559] shadow-sm" 
                        value={modal.data?.score || ''} onChange={e => setModal({...modal, data: { ...modal.data, score: e.target.value }})} placeholder="-" />
                      <span className="text-4xl font-black text-slate-300">/</span>
                      <input type="number" min="0" className="w-24 p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-black text-3xl text-center text-[#1B2559] shadow-sm" 
                        value={modal.data?.totalScore || ''} onChange={e => setModal({...modal, data: { ...modal.data, totalScore: e.target.value }})} placeholder="-" />
                    </div>
                  </div>

                  {/* Right Column: Attachments */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide mb-2 block">Attach Marked Work</label>
                      <div className="relative border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-2xl p-4 text-center hover:bg-emerald-50 transition-colors cursor-pointer group">
                        <input type="file" accept=".pdf, image/*" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleAnswerSheetUpload} />
                        <p className="font-bold text-emerald-800 text-sm truncate px-2">Click to Attach Files (Max 5MB combined)</p>
                        {answerSheet.isUploading && <p className="text-xs text-amber-500 mt-1">Uploading...</p>}
                      </div>

                      {/* LIST ATTACHED FILES */}
                      {answerSheet.attachments?.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {answerSheet.attachments.map((file, idx) => (
                            <div key={idx} className="flex flex-col gap-2 bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
                              <div className="flex items-center justify-between">
                                <p 
                                  className="text-sm font-bold text-emerald-800 truncate pr-4 cursor-pointer hover:underline"
                                  onClick={() => setPreviewAttachmentUrl(previewAttachmentUrl === file.url ? null : file.url)}
                                >
                                  📎 {file.name}
                                </p>
                                <div className="flex gap-2 shrink-0">
                                  <button type="button" onClick={() => setPreviewAttachmentUrl(previewAttachmentUrl === file.url ? null : file.url)} className="text-cyan-600 hover:text-cyan-700 font-bold text-xs bg-cyan-50 px-3 py-1.5 rounded-lg">
                                    {previewAttachmentUrl === file.url ? 'Close' : 'Preview'}
                                  </button>
                                  <button type="button" onClick={() => {
                                    const newAttachments = answerSheet.attachments.filter((_, i) => i !== idx);
                                    setAnswerSheet({...answerSheet, attachments: newAttachments});
                                    if (previewAttachmentUrl === file.url) setPreviewAttachmentUrl(null);
                                  }} className="text-rose-500 hover:text-rose-700 font-bold text-xs bg-rose-50 px-3 py-1.5 rounded-lg">Remove</button>
                                </div>
                              </div>
                              {previewAttachmentUrl === file.url && (
                                <div className="w-full h-48 mt-2 border-2 border-slate-100 rounded-lg overflow-hidden relative bg-slate-50 flex items-center justify-center">
                                  {file.url.includes('image') || file.url.startsWith('data:image') ? (
                                    <img src={file.url} alt="Preview" className="w-full h-full object-contain" />
                                  ) : file.url.includes('pdf') || file.url.startsWith('data:application/pdf') ? (
                                    <iframe src={file.url} className="w-full h-full border-0" title="PDF Preview"></iframe>
                                  ) : (
                                    <p className="text-xs text-slate-400 font-bold">Preview not available.</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* PREVIEW BOX */}
                      {(answerSheet.fileUrl || modal.data?.adminAnswerSheetUrl) && !answerSheet.attachments?.length && (
                        <div className="mt-3 w-full h-40 overflow-hidden border border-slate-200 rounded-xl bg-[#F4F7FE] shadow-inner relative flex items-center justify-center p-2">
                          {(answerSheet.fileUrl || modal.data?.adminAnswerSheetUrl).includes('image') || (answerSheet.fileUrl || modal.data?.adminAnswerSheetUrl).startsWith('data:image') ? (
                            <img src={answerSheet.fileUrl || modal.data?.adminAnswerSheetUrl} alt="Marked Work" className="w-full h-full object-contain rounded-lg" />
                          ) : (answerSheet.fileUrl || modal.data?.adminAnswerSheetUrl).includes('pdf') || (answerSheet.fileUrl || modal.data?.adminAnswerSheetUrl).startsWith('data:application/pdf') ? (
                            <iframe src={answerSheet.fileUrl || modal.data?.adminAnswerSheetUrl} className="w-full h-full border-0 rounded-lg" title="PDF Preview"></iframe>
                          ) : (
                            <p className="text-center text-slate-500 font-bold text-xs">Preview not available.</p>
                          )}
                        </div>
                      )}
                      
                      {/* ACTIONS FOR EXISTING FILE */}
                      {modal.data?.adminAnswerSheetUrl && !answerSheet.attachments?.length && (!answerSheet.fileName || answerSheet.fileName === 'Existing Marked/Checked work Attached') && (
                        <div className="flex items-center gap-4 mt-3 bg-white p-2 rounded-xl border border-slate-100 justify-center shadow-sm">
                          <button type="button" onClick={() => window.open(modal.data.adminAnswerSheetUrl, "_blank")} className="text-xs font-black text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
                            👁️ View Full File
                          </button>
                          <span className="text-slate-200">|</span>
                          <button type="button" onClick={() => setModal({ type: 'deleteAnsSheet', hwId: modal.hwId, data: { score: modal.data.score, totalScore: modal.data.totalScore } })} className="text-xs font-black text-rose-500 hover:text-rose-600 flex items-center gap-1">
                            🗑️ Delete File
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide mb-2 block">Google Drive Link</label>
                      <div className="flex gap-2">
                        <input type="url" className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none font-bold text-[#1B2559] shadow-sm text-sm" 
                          placeholder="https://drive.google.com/..." 
                          value={modal.data?.driveLink || ''} 
                          onChange={e => setModal({...modal, data: { ...modal.data, driveLink: e.target.value }})} 
                        />
                        {modal.data?.driveLink && (
                          <button type="button" onClick={() => setModal({...modal, data: { ...modal.data, driveLink: '' }})} className="px-4 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white font-black transition-colors shadow-sm text-xs">
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide mb-2 block">Teacher Comments / Feedback (Visible to Student)</label>
                  <textarea className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl focus:ring-4 focus:ring-emerald-500/20 outline-none font-medium text-[#1B2559] min-h-[100px] shadow-sm"
                    placeholder="Add feedback, comments, or praise for the student..."
                    value={modal.data?.feedback || ''}
                    onChange={e => setModal({...modal, data: { ...modal.data, feedback: e.target.value }})}
                  />
                </div>
              </>
            )}
            {modal.type === 'allocate' && (
              <>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Allocate Students</h3>
                <p className="text-slate-500 text-sm mb-4">Select the specific students this grader will mark.</p>
                
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
                  {students.filter(s => yearGroupAllocate === 'all' || s.yearGroup === yearGroupAllocate)
                    .sort((a, b) => (a.registrationName || a.name || '').localeCompare(b.registrationName || b.name || ''))
                    .map(s => {
                    const isInitiallyAllocated = graders.find(g => g._id === modal.graderId)?.allocatedStudents?.some(allocated => allocated._id === s._id || allocated === s._id);
                    const allocatedToOtherGrader = graders.find(g => g._id !== modal.graderId && g.allocatedStudents?.some(allocated => allocated._id === s._id || allocated === s._id));
                    
                    return (
                      <label key={s._id} className={`flex items-center justify-between p-2 rounded-lg transition-colors ${allocatedToOtherGrader ? 'opacity-50 cursor-not-allowed bg-slate-100' : selectedStudentsToAllocate.includes(s._id) ? 'bg-indigo-50/50 cursor-pointer' : 'hover:bg-slate-200 cursor-pointer'}`}>
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded disabled:opacity-50" 
                            checked={selectedStudentsToAllocate.includes(s._id)}
                            disabled={!!allocatedToOtherGrader}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedStudentsToAllocate([...selectedStudentsToAllocate, s._id]);
                              else setSelectedStudentsToAllocate(selectedStudentsToAllocate.filter(id => id !== s._id));
                            }}
                          />
                          <span className="font-bold text-sm text-slate-700">{s.registrationName || s.name} {s.yearGroup ? `(${s.yearGroup})` : ''}</span>
                        </div>
                        
                        {isInitiallyAllocated && (
                           <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md shadow-sm">
                             Assigned to this Grader
                           </span>
                        )}
                        {allocatedToOtherGrader && (
                           <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-md shadow-sm">
                             Assigned to {allocatedToOtherGrader.name}
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
                <p className="text-slate-500 text-sm mb-6">Select the new due date and time for this homework.</p>
                <input type="datetime-local" min={minDateTime} className="w-full p-4 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold mb-6" 
                  value={modal.data} onChange={e => setModal({...modal, data: e.target.value})} />
              </>
            )}

            {modal.type === 'adminSubmit' && (
              <>
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <div className="bg-indigo-500 w-2 h-8 rounded-full"></div>
                  <h3 className="text-2xl font-black text-[#1B2559]">Submit on Behalf of Student</h3>
                </div>
                <p className="text-slate-500 text-sm mb-6">Upload the student's work file or enter their text answer manually to mark this task as Submitted.</p>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide mb-2 block">Comments (Optional)</label>
                    <textarea className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium text-[#1B2559] min-h-[100px]" 
                      placeholder="Enter text answer..." 
                      value={adminSubmitForm.answerText} onChange={e => setAdminSubmitForm({...adminSubmitForm, answerText: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide mb-2 block">Attach Student's Files</label>
                    <div className="relative border-2 border-dashed border-indigo-300 bg-indigo-50/50 rounded-2xl p-4 text-center hover:bg-indigo-50 transition-colors cursor-pointer group">
                      <input type="file" accept=".pdf, image/*" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleAdminSubmitFileUpload} />
                      <p className="font-bold text-indigo-800 text-sm truncate px-2">Drag or Click to Attach Files (Max 5MB combined)</p>
                      {adminSubmitFile.isUploading && <p className="text-xs text-amber-500 mt-1">Uploading...</p>}
                    </div>
                    
                    {/* LIST ATTACHED FILES */}
                    {adminSubmitForm.attachments?.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {adminSubmitForm.attachments.map((file, idx) => (
                          <div key={idx} className="flex flex-col gap-2 bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
                            <div className="flex items-center justify-between">
                              <p 
                                className="text-sm font-bold text-indigo-800 truncate pr-4 cursor-pointer hover:underline"
                                onClick={() => setPreviewAttachmentUrl(previewAttachmentUrl === file.url ? null : file.url)}
                              >
                                📎 {file.name}
                              </p>
                              <div className="flex gap-2 shrink-0">
                                <button type="button" onClick={() => setPreviewAttachmentUrl(previewAttachmentUrl === file.url ? null : file.url)} className="text-cyan-600 hover:text-cyan-700 font-bold text-xs bg-cyan-50 px-3 py-1.5 rounded-lg">
                                  {previewAttachmentUrl === file.url ? 'Close' : 'Preview'}
                                </button>
                                <button type="button" onClick={() => {
                                  const newAttachments = adminSubmitForm.attachments.filter((_, i) => i !== idx);
                                  setAdminSubmitForm({...adminSubmitForm, attachments: newAttachments});
                                  if (previewAttachmentUrl === file.url) setPreviewAttachmentUrl(null);
                                }} className="text-rose-500 hover:text-rose-700 font-bold text-xs bg-rose-50 px-3 py-1.5 rounded-lg">Remove</button>
                              </div>
                            </div>
                            {previewAttachmentUrl === file.url && (
                              <div className="w-full h-48 mt-2 border-2 border-slate-100 rounded-lg overflow-hidden relative bg-slate-50 flex items-center justify-center">
                                {file.url.includes('image') || file.url.startsWith('data:image') ? (
                                  <img src={file.url} alt="Preview" className="w-full h-full object-contain" />
                                ) : file.url.includes('pdf') || file.url.startsWith('data:application/pdf') ? (
                                  <iframe src={file.url} className="w-full h-full border-0" title="PDF Preview"></iframe>
                                ) : (
                                  <p className="text-xs text-slate-400 font-bold">Preview not available.</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {(modal.type === 'delete' || modal.type === 'deleteStudent' || modal.type === 'deleteAnsSheet' || modal.type === 'deleteGrader' || modal.type === 'deleteScheme' || modal.type === 'deleteAllSchemes' || modal.type === 'deleteAllTopics') && (
  <>
    <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-4 text-3xl mx-auto">🗑️</div>
    <h3 className="text-2xl font-black text-slate-800 mb-2 text-center">
      {modal.type === 'deleteStudent' ? 'Remove Student?' : 
       modal.type === 'deleteAnsSheet' ? 'Delete Marked/Checked work?' : 
       modal.type === 'deleteGrader' ? 'Delete Grader?' : 
       modal.type === 'deleteAllSchemes' ? 'Delete ALL Reports?' : 
       modal.type === 'deleteAllTopics' ? (modal.data ? "Delete Student's Topics?" : 'Delete ALL Topics?') : 
       modal.type === 'deleteScheme' ? 'Delete Report?' : 'Delete Homework?'}
    </h3>
    <p className="text-slate-500 text-sm mb-6 text-center">
      {modal.type === 'deleteAnsSheet' ? 'This will remove your uploaded marked/checked work from this graded homework.' : 
       modal.type === 'deleteGrader' ? `Are you sure you want to permanently delete "${modal.data}"?` :
       modal.type === 'deleteAllSchemes' ? 'Are you sure you want to wipe the ENTIRE lesson schedule? This cannot be undone.' :
       modal.type === 'deleteAllTopics' ? (modal.data ? 'Are you sure you want to wipe ALL Topic Records for this specific student? This cannot be undone.' : 'Are you sure you want to wipe ALL Topic Records for EVERYONE? This cannot be undone.') :
       'This action is permanent and cannot be undone.'}
    </p>
  </>
)}

            {modal.type === 'viewOriginalWork' && (
              <>
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <div className="bg-sky-500 w-2 h-8 rounded-full"></div>
                  <h3 className="text-2xl font-black text-[#1B2559]">Original Assigned Work</h3>
                </div>

                <div className="space-y-6 mb-6">
                  {modal.data.content && (
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                      <h4 className="text-xs font-black text-[#A3AED0] uppercase tracking-wide mb-3">Written Content / Instructions</h4>
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-inner max-h-[200px] overflow-y-auto custom-scrollbar">
                        <p className="text-[#1B2559] whitespace-pre-wrap font-medium text-sm leading-relaxed">{modal.data.content}</p>
                      </div>
                    </div>
                  )}

                  {modal.data.studentInstructions && (
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                      <h4 className="text-xs font-black text-[#A3AED0] uppercase tracking-wide mb-3">Student Instructions</h4>
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-inner max-h-[200px] overflow-y-auto custom-scrollbar">
                        <p className="text-[#1B2559] whitespace-pre-wrap font-medium text-sm leading-relaxed">{modal.data.studentInstructions}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">📎 Attached Files</h4>
                    
                    {modal.data.attachments?.length > 0 ? (
                      <div className="space-y-6">
                        {modal.data.attachments.map((attachment, idx) => (
                          <div key={idx} className="bg-[#F4F7FE] p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-black text-[#1B2559] text-sm truncate pr-4">File {idx + 1}: {attachment.name}</span>
                              <button type="button" onClick={() => window.open(attachment.url, "_blank")} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0">
                                View File
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : modal.data.fileUrl ? (
                       <div className="bg-[#F4F7FE] p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                         <div className="flex justify-between items-center">
                           <span className="font-black text-[#1B2559] text-sm">Attached File</span>
                           <button type="button" onClick={() => window.open(modal.data.fileUrl, "_blank")} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0">
                            View File
                           </button>
                         </div>
                       </div>
                    ) : (
                      <div className="flex items-center justify-center p-10 text-slate-400 font-bold bg-slate-50 rounded-3xl border border-slate-200">
                        No files attached to this assignment.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {modal.type === 'viewWork' && (
              <>
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <div className="bg-[#1B2559] w-2 h-8 rounded-full"></div>
                  <h3 className="text-2xl font-black text-[#1B2559]">Student's Submission</h3>
                </div>

                <div className="space-y-6 mb-6">
                  {/* Written Answer Section (if any) */}
                  {modal.data.answerText && (
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                      <h4 className="text-xs font-black text-[#A3AED0] uppercase tracking-wide mb-3">Written Answer</h4>
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-inner max-h-[200px] overflow-y-auto custom-scrollbar">
                        <p className="text-[#1B2559] whitespace-pre-wrap font-medium text-sm leading-relaxed">{modal.data.answerText}</p>
                      </div>
                    </div>
                  )}

                  {/* Attached Files Section */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">📎 Attached Work Files</h4>
                    
                    {modal.data.attachments?.length > 0 ? (
                      <div className="space-y-6">
                        {modal.data.attachments.map((attachment, idx) => (
                          <div key={idx} className="bg-[#F4F7FE] p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-black text-[#1B2559] text-sm">File {idx + 1}: {attachment.name}</span>
                              <button type="button" onClick={async () => {
                                const studentName = modal.student?.registrationName || modal.student?.name || 'Unknown';
                                const yearGroup = modal.student?.yearGroup || 'Y?';
                                const initials = studentName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                                let formattedTitle = (modal.title || '').toUpperCase().replace(' HW ', ' SW ').replace(' TEST ', ' SW ');
                                let ext = attachment.name.includes('.') ? attachment.name.substring(attachment.name.lastIndexOf('.')) : '.pdf';
                                const fileName = `${initials} - ${yearGroup} - ${formattedTitle}${ext}`;

                                try {
                                  const response = await fetch(attachment.url);
                                  const blob = await response.blob();
                                  const blobUrl = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.style.display = 'none';
                                  a.href = blobUrl;
                                  a.download = fileName;
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(blobUrl);
                                  document.body.removeChild(a);
                                } catch (error) {
                                  console.error("Direct download failed", error);
                                  window.open(attachment.url, "_blank");
                                }
                              }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5">
                                ⬇️ Download File
                              </button>
                            </div>

                            <div className="w-full h-[400px] overflow-hidden border-2 border-slate-200 rounded-2xl bg-white p-2 shadow-inner relative flex items-center justify-center">
                              {attachment.url.includes('image') || attachment.url.startsWith('data:image') ? (
                                <img src={attachment.url} alt={attachment.name} className="w-full h-full object-contain rounded-xl" />
                              ) : attachment.url.includes('pdf') || attachment.url.startsWith('data:application/pdf') ? (
                                <iframe src={attachment.url} className="w-full h-full border-0 rounded-xl" title={`PDF Preview ${idx}`}></iframe>
                              ) : (
                                <p className="text-center text-slate-500 font-bold">Preview not available for this format.</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : modal.data.answerFileUrl ? (
                      <div className="bg-[#F4F7FE] p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex justify-end">
                          <button type="button" onClick={async () => {
                            const studentName = modal.student?.registrationName || modal.student?.name || 'Unknown';
                            const yearGroup = modal.student?.yearGroup || 'Y?';
                            const initials = studentName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                            let formattedTitle = (modal.title || '').toUpperCase().replace(' HW ', ' SW ').replace(' TEST ', ' SW ');
                            let ext = '.pdf';
                            if (modal.data.answerFileUrl.includes('image/jpeg') || modal.data.answerFileUrl.includes('image/jpg')) ext = '.jpg';
                            else if (modal.data.answerFileUrl.includes('image/png')) ext = '.png';
                            const fileName = `${initials} - ${yearGroup} - ${formattedTitle}${ext}`;

                            try {
                              const response = await fetch(modal.data.answerFileUrl);
                              const blob = await response.blob();
                              const blobUrl = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.style.display = 'none';
                              a.href = blobUrl;
                              a.download = fileName;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(blobUrl);
                              document.body.removeChild(a);
                            } catch (error) {
                              console.error("Direct download failed", error);
                              window.open(modal.data.answerFileUrl, "_blank");
                            }
                          }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5">
                            ⬇️ Download File
                          </button>
                        </div>
                        <div className="w-full h-[400px] overflow-hidden border-2 border-slate-200 rounded-2xl bg-white p-2 shadow-inner relative flex items-center justify-center">
                          {modal.data.answerFileUrl.includes('image') || modal.data.answerFileUrl.startsWith('data:image') ? (
                            <img src={modal.data.answerFileUrl} alt="Submission" className="w-full h-full object-contain rounded-xl" />
                          ) : (
                            <iframe src={modal.data.answerFileUrl} className="w-full h-full border-0 rounded-xl" title="PDF Preview"></iframe>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-10 text-slate-400 font-bold bg-slate-50 rounded-3xl border border-slate-200">
                        No files attached to this submission.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            {modal.type === 'graderInstruction' && modal.data !== 'skip' && (
              <>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Instruction for Grader</h3>
                <p className="text-slate-500 text-sm mb-4">Optional: Do you want to send any specific instructions to the grader for today's homework?</p>
                
                {/* Grader Selection (Admin Only) */}
                {user?.role === 'admin' && graders.length > 0 && (
                  <div className="mb-4 text-left">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Target Grader</label>
                    
                    {(() => {
                      if (schemeForm.studentId !== 'all') {
                        const allocatedGrader = graders.find(g => 
                          g.allocatedStudents?.some(s => s._id === schemeForm.studentId || s === schemeForm.studentId)
                        );
                        
                        if (allocatedGrader) {
                          return (
                            <div className="w-full p-4 mt-1 bg-indigo-50/50 border border-indigo-100 rounded-2xl font-bold text-indigo-900 flex items-center gap-3">
                              <span className="text-xl">👨‍🏫</span>
                              <span>{allocatedGrader.name}</span>
                              <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md shadow-sm ml-auto">
                                Automatically Allocated
                              </span>
                            </div>
                          );
                        }
                      }
                      
                      return (
                        <select 
                          className="w-full max-w-full truncate p-4 mt-1 bg-indigo-50/50 border border-indigo-100 rounded-2xl outline-none font-bold text-indigo-900 focus:ring-4 focus:ring-indigo-500/20 transition-all"
                          value={schemeForm.targetGrader || 'all'}
                          onChange={e => setSchemeForm({...schemeForm, targetGrader: e.target.value})}
                        >
                          <option value="all">📢 General / All Graders</option>
                          {graders.map(grader => {
                            const studentsList = grader.allocatedStudents?.length > 0 
                              ? grader.allocatedStudents.map(s => s.registrationName || s.name)
                              : [];
                              
                            let displayNames = 'No students assigned';
                            let fullNames = 'No students assigned';
                            
                            if (studentsList.length > 0) {
                              fullNames = studentsList.join(', ');
                              displayNames = studentsList.length > 2 
                                ? `${studentsList.slice(0, 2).join(', ')} + ${studentsList.length - 2} more`
                                : fullNames;
                            }

                            return (
                              <option key={grader._id} value={grader._id} title={fullNames}>
                                👨‍🏫 {grader.name} ({displayNames})
                              </option>
                            );
                          })}
                        </select>
                      );
                    })()}
                  </div>
                )}

                <textarea className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-medium text-[#1B2559] min-h-[120px] mb-6 transition-all" 
                  placeholder="e.g. Please assign 5 hard questions on algebra..." 
                  value={graderInstruction} onChange={e => setGraderInstruction(e.target.value)} />
              </>
            )}
            <div className="flex gap-4">
              {modal.type === 'viewWork' || modal.type === 'viewOriginalWork' ? (
                <button onClick={() => setModal({ type: null, hwId: null, studentId: null, data: '' })} className="w-full py-4 bg-slate-100 text-slate-700 hover:bg-slate-200 font-black rounded-2xl transition-colors">
                  Close Preview
                </button>
              ) : (
                <>
                  <button onClick={() => { 
  setModal({ type: null, hwId: null, studentId: null, data: '' }); 
  setAnswerSheet({ fileUrl: '', fileName: '', attachments: [], isUploading: false }); 
  setGraderInstruction('');
  setAdminSubmitForm({ answerText: '', answerFileUrl: '', attachments: [] });
  setAdminSubmitFile({ fileName: '', isUploading: false }); 
  setSchemeForm({ date: new Date().toISOString().split('T')[0], startTime: '', endTime: '', title: '', weekNo: '', topic: '', description: '', classStatus: 'Class Taken', yearGroupFilter: 'all', studentId: 'all' }); 
}} className="flex-1 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold rounded-2xl transition-colors">
  Cancel
</button>
                  <button onClick={executeModalAction} className={`flex-1 py-4 font-bold rounded-2xl text-white transition-transform hover:-translate-y-1 shadow-lg
  ${(modal.type === 'delete' || modal.type === 'deleteStudent' || modal.type === 'deleteAnsSheet' || modal.type === 'deleteGrader' || modal.type === 'deleteScheme' || modal.type === 'deleteAllSchemes' || modal.type === 'deleteAllTopics') ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30' :
    modal.type === 'grade' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 
    'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'}`}>
  {(modal.type === 'delete' || modal.type === 'deleteStudent' || modal.type === 'deleteAnsSheet' || modal.type === 'deleteGrader') ? 'Yes, Delete' : 'Confirm'}
</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

{isSidebarOpen && (
  <div 
    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" 
    onClick={() => setIsSidebarOpen(false)}
  />
)}

{/* SIDEBAR */}
<aside className={`w-72 bg-[#0B1437] text-slate-300 flex flex-col shadow-2xl z-50 fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 lg:flex rounded-r-[2rem] my-4 lg:ml-4 overflow-hidden`}>
        
        {/* 1. Header */}
        <div 
          onClick={() => { 
            if (user?.role === 'admin') {
              navigate('/admin-dashboard/settings'); 
              setIsSidebarOpen(false); 
            }
          }}
          className={`p-8 flex items-center gap-4 border-b border-slate-700/50 shrink-0 transition-colors ${user?.role === 'admin' ? 'cursor-pointer group hover:bg-slate-800/50' : ''}`}
          title={user?.role === 'admin' ? "Go to Settings to Upload Profile Picture" : "MathCom Mentors"}
        >
          <div className="relative">
            {adminProfile?.profilePic ? (
              <img src={adminProfile.profilePic} alt="Profile" className={`w-12 h-12 rounded-2xl object-cover shadow-lg shadow-indigo-500/30 transition-opacity ${user?.role === 'admin' ? 'group-hover:opacity-75' : ''}`} />
            ) : (
              <div className={`bg-gradient-to-tr from-indigo-500 to-purple-500 text-white w-12 h-12 flex items-center justify-center rounded-2xl font-black text-2xl shadow-lg shadow-indigo-500/30 transition-opacity ${user?.role === 'admin' ? 'group-hover:opacity-75' : ''}`}>
                M
              </div>
            )}
            
            {user?.role === 'admin' && (
              <div className="absolute inset-0 bg-[#0B1437]/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
            )}
            
            {user?.role === 'admin' && !adminProfile?.profilePic && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border border-[#0B1437]"></span>
              </span>
            )}
          </div>
          <div>
            <h1 className={`text-lg font-black text-white tracking-wide leading-tight transition-colors ${user?.role === 'admin' ? 'group-hover:text-indigo-400' : ''}`}>MathCom<br/>Mentors</h1>
            
            {user?.role === 'admin' && !adminProfile?.profilePic && (
              <p className="text-[10px] text-indigo-400 font-bold mt-1 group-hover:underline">Click to upload your photo</p>
            )}
          </div>
        </div>
        
        {/* 2. Navigation Links */}
        <div className="relative flex-1 flex flex-col overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#0B1437] to-transparent pointer-events-none z-10"></div>
          
          <div className="p-6 space-y-3 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            {/* FOR ADMIN ONLY */}
            {user?.role === 'admin' && (
              <>
                {/* 1. Create Homework */}
                <button onClick={() => { navigate('/admin-dashboard/dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                  Create Homework 
                </button>

                {/* 2. Submitted Work */}
                <button onClick={() => { navigate('/admin-dashboard/submitted'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'submitted' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Submitted Work 
                </button>

                {/* 3. Students Enrolled */}
                <button onClick={() => { navigate('/admin-dashboard/students'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'students' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                  Enrolled Students 
                </button>

                {/* 4. Class Planner */}
                <button onClick={() => { navigate('/admin-dashboard/planner'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'planner' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                   Class Planner
                </button>

                {/* 5. Lesson Schedule */}
                <button onClick={() => { navigate('/admin-dashboard/scheme'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'scheme' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Lesson Schedule
                </button>

                {/* 5.5 Topic Tracker */}
                <button onClick={() => { navigate('/admin-dashboard/topics'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'topics' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                  Topics Covered
                </button>

                {/* 6. Google Drive */}
                <button onClick={() => { navigate('/admin-dashboard/drive'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'drive' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
                  Google Drive
                </button>

                {/* 7. Manage Graders */}
                <button onClick={() => { navigate('/admin-dashboard/graders'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'graders' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  Manage Graders
                </button>

                {/* 8. Direct Messages */}
                <button onClick={() => { navigate('/admin-dashboard/messages'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'messages' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                  Direct Messages
                </button>

                {/* 9. Schedule Tests */}
                <button onClick={() => { navigate('/admin-dashboard/tests'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'tests' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Schedule Tests 
                </button>

                {/* 10. Announcements */}
                <button onClick={() => { navigate('/admin-dashboard/announcements'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'announcements' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
                  Announcements
                </button>

                {/* 11. Study Materials */}
                <button onClick={() => { navigate('/admin-dashboard/library'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'library' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                  Study Materials
                </button>

                {/* 12. Analytics */}
                <button onClick={() => { navigate('/admin-dashboard/analytics'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                  Analytics
                </button>

                {/* 13. Settings */}
                <button onClick={() => { navigate('/admin-dashboard/settings'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  Settings
                </button>
              </>
            )}

            {/* GRADER TABS */}
            {user?.role === 'grader' && (
              <>
                <button onClick={() => { navigate('/grader-dashboard/dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                  Create Homework 
                </button>

                <button onClick={() => { navigate('/grader-dashboard/submitted'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'submitted' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Submitted Work 
                </button>

                <button onClick={() => { navigate('/grader-dashboard/drive'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'drive' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
                  Google Drive
                </button>

                <button onClick={() => { navigate('/grader-dashboard/tests'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'tests' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Schedule Tests 
                </button>
                
                <button onClick={() => { navigate('/grader-dashboard/scheme'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'scheme' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Lesson Schedule
                </button>

                <button onClick={() => { navigate('/grader-dashboard/messages'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'messages' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                  Direct Messages
                </button>
              </>
            )}
            
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0B1437] to-transparent pointer-events-none z-10 flex items-end justify-center pb-1">
            <svg className="w-5 h-5 text-slate-500/60 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
        
        {/* 3. Sign Out */}
        <div className="p-6 border-t border-slate-700/50 shrink-0">
          <button onClick={() => { handleLogout(); setIsSidebarOpen(false); }} className="w-full flex justify-center items-center gap-2 bg-slate-800 hover:bg-rose-500 text-slate-300 hover:text-white px-5 py-4 rounded-2xl font-bold transition-all shadow-sm group">
            <svg className="w-5 h-5 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
<div className="flex-1 overflow-y-auto scroll-smooth p-3 sm:p-6 lg:p-10 w-full overflow-x-hidden">
        <div className="max-w-[1600px] mx-auto">
    <div className="lg:hidden flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-500 w-10 h-10 flex items-center justify-center rounded-xl text-white font-bold">M</div>
        <h1 className="font-black text-[#1B2559] text-xl">Portal</h1>
      </div>
      <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-100 rounded-lg text-[#1B2559] hover:bg-slate-200">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
      </button>
    </div>
          
          {/* Header */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6">
  <div>
    <h1 className="text-4xl font-black text-[#1B2559]">Welcome back, {adminProfile.name} </h1>
    <p className="text-[#A3AED0] mt-2 font-bold tracking-wide">Here is what is happening in your classes today.</p>
  </div>
  
  {/* ONLY ADMIN CAN SEE THE TOTAL STUDENTS COUNTER */}
  {user?.role === 'admin' && (
    <div className="flex gap-4 w-full xl:w-auto shrink-0">
      <div className="bg-white px-6 py-4 rounded-3xl shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4 w-full sm:w-auto">
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
            <div className="animate-fade-in relative">
              
              {/* ASSIGN HOMEWORK MODAL */}
              {isAssignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                  <div className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl transform scale-100 animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                      <div className="bg-indigo-600 w-2 h-8 rounded-full"></div>
                      <h2 className="text-2xl font-black text-[#1B2559]">
                      {editHomeworkId ? 'View / Edit Homework' : 'Assign New Homework'}
                      </h2>
                    </div>
                    
                    <form onSubmit={async (e) => {
                      await handleAssignSubmit(e);
                      if (assignForm.dueDate) setIsAssignModalOpen(false);
                    }} className="space-y-6">
                      {/* WEEK AND TOPIC FIELDS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                          <div className="space-y-1">
                          <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Week No</label>
                          <input type="text" className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/20 text-[#1B2559] outline-none transition-all font-bold" 
                            placeholder="e.g. 1" value={assignForm.weekNo} onChange={e => {
                              const newWeek = e.target.value;
                              setAssignForm({
                                ...assignForm, 
                                weekNo: newWeek, 
                                title: `WEEK ${newWeek} HW - ${assignForm.topic}`.toUpperCase()
                              });
                            }} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Topic Covered</label>
                          <input type="text" className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/20 text-[#1B2559] outline-none transition-all font-bold" 
                            placeholder="e.g. Line Graph" value={assignForm.topic} onChange={e => {
                              const newTopic = e.target.value;
                              setAssignForm({
                                ...assignForm, 
                                topic: newTopic, 
                                title: `WEEK ${assignForm.weekNo} HW - ${newTopic}`.toUpperCase()
                              });
                            }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Homework Title (Auto-Generated)</label>
                        <input className="w-full p-4 bg-[#E2E8F0] border-none rounded-2xl text-[#1B2559] outline-none font-bold opacity-70 cursor-not-allowed" 
                          placeholder="WEEK X HW - TOPIC" required value={assignForm.title} readOnly />
                      </div>

                      {/* FILTER BY YEAR, STUDENT, AND DIFFICULTY */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Filter by Year</label>
                          <select className="w-full max-w-full truncate p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]"
                            value={yearGroupAssign} 
                            onChange={e => {
                              setYearGroupAssign(e.target.value);
                              setAssignForm(prev => ({ ...prev, studentId: '' }));
                            }}>
                            <option value="all">All Years</option>
                            {[...new Set(students.map(s => s.yearGroup).filter(Boolean))].map(yg => (
                              <option key={yg} value={yg}>{yg}</option>
                            ))}
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

                        <div className="md:col-span-2 space-y-1">
                          <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Select Student</label>
                          <select className="w-full max-w-full truncate p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]" 
                            onChange={e => setAssignForm({...assignForm, studentId: e.target.value})} value={assignForm.studentId}>
                            <option value="">-- Choose a Student --</option>
                            {students.filter(s => yearGroupAssign === 'all' || s.yearGroup === yearGroupAssign)
                              .sort((a, b) => (a.registrationName || a.name || '').localeCompare(b.registrationName || b.name || ''))
                              .map(s => (
                              <option key={s._id} value={s._id}>{s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black text-indigo-500 uppercase tracking-wide ml-1">Deadline Date & Time</label>
                        <input type="datetime-local" required min={minDateTime}
                          className="w-full max-w-full p-4 bg-indigo-50 border-none text-indigo-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-black cursor-pointer" 
                          value={assignForm.dueDate}
                          onChange={e => setAssignForm({...assignForm, dueDate: e.target.value})} />
                      </div>

                      <div className="space-y-1 mt-4">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Instructions for Student (Optional)</label>
                        <textarea className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/20 text-[#1B2559] outline-none font-bold" 
                          placeholder="e.g. Please show all your working out..." 
                          value={assignForm.studentInstructions} onChange={e => setAssignForm({...assignForm, studentInstructions: e.target.value})} />
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
                            <>
                              <div className="relative border-2 border-dashed border-indigo-300 bg-[#F4F7FE] rounded-3xl p-10 text-center hover:bg-indigo-50 transition-colors cursor-pointer group">
                                <input type="file" accept=".pdf, image/*" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleFileUpload} />
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform text-3xl">📁</div>
                                <p className="font-black text-[#1B2559]">Drag & Drop or Click to Attach Files</p>
                                <p className="text-xs font-bold text-[#A3AED0] mt-1">PDF, JPG, PNG (Combined Max 5MB)</p>
                                {isUploading && <p className="mt-3 text-sm font-bold text-amber-500">Processing file(s)...</p>}
                              </div>
                          
                              {/* LIST ATTACHED FILES */}
                              {assignForm.attachments?.length > 0 && (
                                <div className="mt-4 space-y-3">
                                  {assignForm.attachments.map((file, idx) => (
                                    <div key={idx} className="flex flex-col gap-2 bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
                                      <div className="flex items-center justify-between">
                                        <p 
                                          className="text-sm font-bold text-indigo-800 truncate pr-4 cursor-pointer hover:underline"
                                          onClick={() => setPreviewAttachmentUrl(previewAttachmentUrl === file.url ? null : file.url)}
                                        >
                                          📎 {file.name}
                                        </p>
                                        <div className="flex gap-2 shrink-0">
                                          <button type="button" onClick={() => setPreviewAttachmentUrl(previewAttachmentUrl === file.url ? null : file.url)} className="text-cyan-600 hover:text-cyan-700 font-bold text-xs bg-cyan-50 px-3 py-1.5 rounded-lg">
                                            {previewAttachmentUrl === file.url ? 'Close' : 'Preview'}
                                          </button>
                                          <button type="button" onClick={() => {
                                            const newAttachments = assignForm.attachments.filter((_, i) => i !== idx);
                                            setAssignForm({...assignForm, attachments: newAttachments});
                                            if (previewAttachmentUrl === file.url) setPreviewAttachmentUrl(null);
                                          }} className="text-rose-500 hover:text-rose-700 font-bold text-xs bg-rose-50 px-3 py-1.5 rounded-lg">Remove</button>
                                        </div>
                                      </div>
                                      {previewAttachmentUrl === file.url && (
                                        <div className="w-full h-48 mt-2 border-2 border-slate-100 rounded-lg overflow-hidden relative bg-slate-50 flex items-center justify-center">
                                          {file.url.includes('image') || file.url.startsWith('data:image') ? (
                                            <img src={file.url} alt="Preview" className="w-full h-full object-contain" />
                                          ) : file.url.includes('pdf') || file.url.startsWith('data:application/pdf') ? (
                                            <iframe src={file.url} className="w-full h-full border-0" title="PDF Preview"></iframe>
                                          ) : (
                                            <p className="text-xs text-slate-400 font-bold">Preview not available.</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Backward compatibility for old single files */}
                              {assignForm.fileUrl && assignForm.attachments?.length === 0 && (
                                <div className="mt-4 w-full h-64 overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-inner relative flex items-center justify-center p-2">
                                  {assignForm.fileUrl.includes('image') || assignForm.fileUrl.startsWith('data:image') ? (
                                    <img src={assignForm.fileUrl} alt="Attached Work" className="w-full h-full object-contain rounded-xl" />
                                  ) : assignForm.fileUrl.includes('pdf') || assignForm.fileUrl.startsWith('data:application/pdf') ? (
                                    <iframe src={assignForm.fileUrl} className="w-full h-full border-0 rounded-xl" title="PDF Preview"></iframe>
                                  ) : (
                                    <div className="flex flex-col items-center gap-2">
                                      <p className="text-center text-slate-500 font-bold">Preview not available.</p>
                                      <a href={assignForm.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-black hover:bg-indigo-200">Open File in New Tab</a>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
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
                                      <select className="w-full sm:w-auto p-2 text-sm font-black border-none rounded-xl bg-emerald-100 text-emerald-800 outline-none cursor-pointer"                                    value={mcq.correctOption} onChange={(e) => updateMcq(qIndex, 'correctOption', parseInt(e.target.value))}>
                                        <option value={0}>Option 1</option><option value={1}>Option 2</option><option value={2}>Option 3</option><option value={3}>Option 4</option>
                                      </select>
                                    </div>
                                    
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

                      <div className="flex gap-3 mt-6">
                        <button type="button" onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-colors">
                          Cancel
                        </button>
                        <button type="submit" className="flex-1 bg-[#1B2559] hover:bg-indigo-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg transform hover:-translate-y-1">
                          {editHomeworkId ? 'Save Replaced Work' : 'Publish Homework'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* TABLE FOR SUBMISSIONS */}
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-100 pb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 w-2 h-8 rounded-full"></div>
                    <h2 className="text-2xl font-black text-[#1B2559]">Submissions Board</h2>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-wrap justify-end">
                    <div className="relative">
                      <svg className="w-5 h-5 absolute left-4 top-3 text-[#A3AED0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      <input type="text" placeholder="Search tasks..." 
                        className="w-full sm:w-72 p-3 pl-12 bg-[#F4F7FE] border-none rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-[#1B2559]"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    <button onClick={() => {
                      setEditHomeworkId(null); 
                      setAssignForm({ title: '', weekNo: '', topic: '', type: 'File', studentId: '', difficulty: 'Medium', dueDate: getDefaultDueDate(), fileUrl: '', attachments: [], content: '', studentInstructions: '', mcqs: [{ question: '', options: ['', '', '', ''], correctOption: 0 }]});
                      setIsAssignModalOpen(true);
                      }} className="px-6 py-3 font-black rounded-xl shadow-lg transition-transform flex items-center justify-center gap-2 whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white hover:-translate-y-1">
                      <span>+</span> Assign New Homework
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 sm:items-end">
                  <div className="flex-1 min-w-[110px]">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Filter by Year</label>
                    <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm"
                      value={hwYearFilter} onChange={e => { setHwYearFilter(e.target.value); setHwStudentFilter('all'); }}>
                      <option value="all">All Years</option>
                      {[...new Set(students.map(s => s.yearGroup).filter(Boolean))].map(yg => (
                        <option key={yg} value={yg}>{yg}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-[1.5] min-w-[150px]">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Filter by Student</label>
                    <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm"
                      value={hwStudentFilter} onChange={e => setHwStudentFilter(e.target.value)}>
                      <option value="all">All Filtered Students</option>
                      {students
                        .filter(s => hwYearFilter === 'all' || s.yearGroup === hwYearFilter)
                        .sort((a, b) => (a.registrationName || a.name || '').localeCompare(b.registrationName || b.name || ''))
                        .map(s => (
                        <option key={s._id} value={s._id}>{s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1 min-w-[110px]">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Filter by Status</label>
                    <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm"
                      value={hwStatusFilter} onChange={e => setHwStatusFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Submitted">Submitted (Review)</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto w-full max-w-full pb-4 relative max-h-[600px] custom-scrollbar">
                  <table className="w-full min-w-[1000px] text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-indigo-600 text-white text-xs font-black uppercase tracking-wider sticky top-0 z-10 align-top shadow-sm">
                        <th className="p-4 rounded-tl-2xl cursor-pointer hover:bg-indigo-700 transition-colors" onClick={() => handleSortHomework('title')}>
                          Task Details {hwSortConfig.key === 'title' ? (hwSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-indigo-700 transition-colors" onClick={() => handleSortHomework('student')}>
                          Assigned To {hwSortConfig.key === 'student' ? (hwSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-indigo-700 transition-colors" onClick={() => handleSortHomework('submissionTime')}>
                          Time Submitted {hwSortConfig.key === 'submissionTime' ? (hwSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-indigo-700 transition-colors" onClick={() => handleSortHomework('dueDate')}>
                          Dates {hwSortConfig.key === 'dueDate' ? (hwSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-indigo-700 transition-colors" onClick={() => handleSortHomework('status')}>
                          Status {hwSortConfig.key === 'status' ? (hwSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 rounded-tr-2xl text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeHomeworks.map((hw, index) => {
                        const isLate = new Date() > new Date(hw.dueDate);
                        
                        return (
                          <tr key={hw._id} className={`border-b border-slate-200 hover:bg-slate-200 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-indigo-50/30'}`}>
                            <td className="p-4 whitespace-normal min-w-[200px] leading-snug">
                              <h3 className="font-black text-[#1B2559]">{formatTaskTitle(hw.title)}</h3>
                              <p className="text-xs font-bold text-slate-500 mt-1">Format: {hw.type}</p>
                            </td>
                            <td className="p-4 font-black text-[#1B2559]">
                              {hw.studentId ? `${capitalizeName(hw.studentId.registrationName || hw.studentId.name)} ${hw.studentId.yearGroup ? `(${hw.studentId.yearGroup})` : ''}` : "Deleted User"}
                            </td>
                            <td className="p-4 font-bold text-[#1B2559]">
                              {hw.submission?.submittedAt ? new Date(hw.submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1 text-xs font-black">
                                <span className="text-slate-500">Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                                {hw.submission?.submittedAt && (
                                  <span className="text-indigo-600">Sub: {new Date(hw.submission.submittedAt).toLocaleDateString()}</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col items-start gap-1.5">
                                <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider
                                  ${hw.status === 'Pending' ? 'bg-slate-100 text-slate-500' : 
                                    hw.status === 'Submitted' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {hw.status}
                                </span>
                                {isLate && hw.status === 'Pending' && (
                                  <span className="bg-rose-100 text-rose-600 px-2 py-1 rounded-md text-[10px] font-black">
                                    Overdue by {getOverdueTime(hw.dueDate)}
                                  </span>
                                )}
                                {hw.submission?.submittedAt && new Date(hw.submission.submittedAt) > new Date(hw.dueDate) && (
                                  <span className="bg-rose-500 text-white px-2 py-1 rounded-md text-[10px] font-black shadow-sm">
                                    LATE SUBMISSION
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                               <div className="flex flex-row flex-nowrap items-center justify-center gap-2 w-max mx-auto">
                                  {hw.status === 'Pending' && (
  <>
    <button onClick={() => {
        setAssignForm({
            title: hw.title, 
            weekNo: hw.weekNo || '', 
            topic: hw.topic || '', 
            type: hw.type, 
            studentId: hw.studentId?._id || '', 
            difficulty: hw.difficulty, 
            dueDate: new Date(hw.dueDate).toISOString().slice(0,16), 
            fileUrl: hw.fileUrl || '', 
            attachments: hw.attachments || [],
            content: hw.content || '', 
            studentInstructions: hw.studentInstructions || '', 
            mcqs: hw.mcqs?.length ? hw.mcqs : [{ question: '', options: ['', '', '', ''], correctOption: 0 }]
        });
        setEditHomeworkId(hw._id);
        setIsAssignModalOpen(true);
    }} className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-600 font-black rounded-lg hover:bg-amber-100 transition-all shadow-sm text-xs">
      View / Edit
    </button>
    <button onClick={() => setModal({ type: 'extend', hwId: hw._id, data: getDefaultDueDate() })} className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 font-black rounded-lg hover:bg-indigo-50 transition-all shadow-sm text-xs">
      Extend
    </button>
    <button onClick={() => setModal({ type: 'adminSubmit', hwId: hw._id, data: hw })} className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-600 font-black rounded-lg hover:bg-indigo-100 transition-all shadow-sm text-xs">
      Submit Work
    </button>
  </>
)}
                                  
                                  {hw.status === 'Submitted' && (
                                    <>
                                      <button onClick={() => setModal({ type: 'viewOriginalWork', data: hw })} className="px-3 py-1.5 bg-sky-50 border border-sky-200 text-sky-600 font-black rounded-lg hover:bg-sky-100 transition-colors shadow-sm text-xs whitespace-nowrap">
                                        View Assigned Work
                                      </button>
                                      {hw.submission && (hw.submission.answerFileUrl || hw.submission.answerText || (hw.submission.attachments && hw.submission.attachments.length > 0)) && (
                                        <button onClick={() => setModal({ type: 'viewWork', hwId: hw._id, data: hw.submission, title: hw.title, student: hw.studentId })} className="px-3 py-1.5 bg-[#1B2559] text-white font-black rounded-lg hover:bg-indigo-900 transition-colors shadow-sm text-xs whitespace-nowrap">
                                          View SW
                                        </button>
                                      )}
                                      <button onClick={() => setModal({ type: 'grade', hwId: hw._id, data: { score: '', totalScore: '', driveLink: hw.driveLink || '', feedback: '' } })} className="px-3 py-1.5 bg-emerald-500 text-white font-black rounded-lg hover:bg-emerald-600 transition-transform hover:-translate-y-1 shadow-sm text-xs flex items-center gap-1 whitespace-nowrap">
                                        Grade
                                      </button>
                                    </>
                                  )}
                                  
                                  {hw.status === 'Graded' && (
                                    <div className="flex items-center gap-2">
                                      {user?.role === 'admin' ? (
                                          <button 
                                        onClick={() => {
                                          setModal({ type: 'grade', hwId: hw._id, data: { score: hw.grading?.score ?? '', totalScore: hw.grading?.totalScore ?? '', driveLink: hw.driveLink || '', feedback: hw.grading?.feedback || '', adminAnswerSheetUrl: hw.grading?.adminAnswerSheetUrl || '' } });
                                          if (hw.grading?.adminAnswerSheetUrl || hw.grading?.adminAttachments?.length > 0) {
                                            setAnswerSheet({ fileUrl: hw.grading.adminAnswerSheetUrl || '', fileName: 'Existing Marked/Checked work Attached', attachments: hw.grading.adminAttachments || [], isUploading: false });
                                          } else {
                                            setAnswerSheet({ fileUrl: '', fileName: '', attachments: [], isUploading: false });
                                          }
                                        }}
                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-black border border-emerald-200 text-xs transition-colors shadow-sm"
                                      >
                                            {hw.grading?.score != null ? `${hw.grading.score}/${hw.grading.totalScore} ✏️` : 'Edit'}
                                          </button>
                                      ) : (
                                        <div className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg font-black border border-slate-200 text-xs shadow-sm cursor-not-allowed">
                                          {hw.grading?.score != null ? `${hw.grading.score}/${hw.grading.totalScore} 🔒` : 'Marked 🔒'}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {user?.role === 'admin' && (
                                    <button onClick={() => setModal({ type: 'delete', hwId: hw._id, data: '' })} className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors shadow-sm" title="Delete">
                                      🗑️
                                    </button>
                                  )}
                               </div>
                            </td>
                          </tr>
                        );
                      })}
                      
                       {activeHomeworks.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center py-20">
                            <div className="flex flex-col items-center justify-center">
                              <div className="text-6xl mb-4 opacity-50">📂</div>
                              <p className="text-[#1B2559] font-black text-xl mb-1">Inbox Zero!</p>
                              <p className="text-[#A3AED0] font-bold">Assign new work using the button above to get started.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SCHEDULE TESTS */}
          {activeTab === 'tests' && (
            <div className="animate-fade-in relative">
              
              {isAssignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                  <div className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl transform scale-100 animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                      <div className="bg-rose-500 w-2 h-8 rounded-full"></div>
                      <h2 className="text-2xl font-black text-[#1B2559]">Schedule New Test</h2>
                    </div>
                    
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!testForm.studentId || testForm.studentId === 'all') return showToast("Please select a specific student!", "error");
                      if (!testForm.startDate || !testForm.dueDate) return showToast("Assign Start & Due Dates!", "error");
                      if (new Date(testForm.startDate) >= new Date(testForm.dueDate)) return showToast("Due date must be after Start date!", "error");
                      try {
                        await api.post('/homework/assign', { 
                          ...testForm, 
                          isTest: true
                        });
                        showToast('🎉 Test scheduled successfully!');
                        fetchData(); 
                        setTestForm({ title: '', weekNo: '', topic: '', type: 'File', studentId: '', difficulty: 'Easy', startDate: '', dueDate: '', fileUrl: '', attachments: [], content: '', studentInstructions: '', mcqs: [{ question: '', options: ['', '', '', ''], correctOption: 0 }] });
                        setTestFileName(''); 
                        setIsAssignModalOpen(false);
                      } catch (err) { showToast('Error scheduling test.', "error"); }
                    }} className="space-y-6">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <div className="space-y-1">
                          <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Week No</label>
                          <input type="text" className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold focus:ring-4 focus:ring-rose-500/20 text-[#1B2559]" 
                            placeholder="e.g. 5" 
                            value={testForm.weekNo} onChange={e => {
                              const newWeek = e.target.value;
                              setTestForm({
                                ...testForm, 
                                weekNo: newWeek, 
                                title: `WEEK ${newWeek} TEST - ${testForm.topic}`.toUpperCase()
                              });
                            }} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Topic</label>
                          <input type="text" className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold focus:ring-4 focus:ring-rose-500/20 text-[#1B2559]" 
                            placeholder="e.g. Algebra" 
                            value={testForm.topic} onChange={e => {
                              const newTopic = e.target.value;
                              setTestForm({
                                ...testForm, 
                                topic: newTopic, 
                                title: `WEEK ${testForm.weekNo} TEST - ${newTopic}`.toUpperCase()
                              });
                            }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Test Title (Auto-Generated)</label>
                        <input className="w-full p-4 bg-[#E2E8F0] border-none rounded-2xl focus:ring-4 focus:ring-rose-500/20 text-[#1B2559] outline-none font-bold opacity-70 cursor-not-allowed" 
                          placeholder="WEEK X TEST - TOPIC" required value={testForm.title} readOnly />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Filter by Year</label>
                          <select className="w-full max-w-full truncate p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]"
                            value={testYearGroupAssign} 
                            onChange={e => {
                              setTestYearGroupAssign(e.target.value);
                              setTestForm(prev => ({ ...prev, studentId: '' }));
                            }}>
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
                          <select className="w-full max-w-full truncate p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]" 
                            onChange={e => setTestForm({...testForm, studentId: e.target.value})} value={testForm.studentId}>
                            <option value="">-- Choose a Student --</option>
                            {students.filter(s => testYearGroupAssign === 'all' || s.yearGroup === testYearGroupAssign)
                              .sort((a, b) => (a.registrationName || a.name || '').localeCompare(b.registrationName || b.name || ''))
                              .map(s => (
                              <option key={s._id} value={s._id}>{s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-black text-rose-500 uppercase tracking-wide ml-1">Start Date & Time (Unlocks)</label>
                          <input type="datetime-local" required min={minDateTime} className="w-full max-w-full p-4 bg-rose-50 text-rose-800 rounded-2xl outline-none cursor-pointer font-bold" 
                            value={testForm.startDate} onChange={e => setTestForm({...testForm, startDate: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-black text-rose-500 uppercase tracking-wide ml-1">Deadline Date & Time</label>
                          <input type="datetime-local" required min={testForm.startDate || minDateTime} className="w-full max-w-full p-4 bg-rose-50 text-rose-800 rounded-2xl outline-none cursor-pointer font-bold" 
                            value={testForm.dueDate} onChange={e => setTestForm({...testForm, dueDate: e.target.value})} />
                        </div>
                      </div>

                      <div className="space-y-1 mt-4">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide ml-1">Instructions for Student (Optional)</label>
                        <textarea className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl focus:ring-4 focus:ring-rose-500/20 text-[#1B2559] outline-none font-bold" 
                          placeholder="e.g. Calculators are not allowed..." 
                          value={testForm.studentInstructions} onChange={e => setTestForm({...testForm, studentInstructions: e.target.value})} />
                      </div>

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
                            <>
                              <div className="relative border-2 border-dashed border-rose-300 bg-[#F4F7FE] rounded-3xl p-10 text-center hover:bg-rose-50 transition-colors cursor-pointer group">
                                <input type="file" accept=".pdf, image/*" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleTestFileUpload} />
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform text-3xl">📁</div>
                                <p className="font-black text-[#1B2559]">Drag & Drop or Click to Attach Files</p>
                                <p className="text-xs font-bold text-[#A3AED0] mt-1">PDF, JPG, PNG (Combined Max 5MB)</p>
                                {isUploading && <p className="mt-3 text-sm font-bold text-amber-500">Processing file(s)...</p>}
                              </div>

                              {testForm.attachments?.length > 0 && (
                                <div className="mt-4 space-y-3">
                                  {testForm.attachments.map((file, idx) => (
                                    <div key={idx} className="flex flex-col gap-2 bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
                                      <div className="flex items-center justify-between">
                                        <p 
                                          className="text-sm font-bold text-rose-800 truncate pr-4 cursor-pointer hover:underline"
                                          onClick={() => setPreviewAttachmentUrl(previewAttachmentUrl === file.url ? null : file.url)}
                                        >
                                          📎 {file.name}
                                        </p>
                                        <div className="flex gap-2 shrink-0">
                                          <button type="button" onClick={() => setPreviewAttachmentUrl(previewAttachmentUrl === file.url ? null : file.url)} className="text-cyan-600 hover:text-cyan-700 font-bold text-xs bg-cyan-50 px-3 py-1.5 rounded-lg">
                                            {previewAttachmentUrl === file.url ? 'Close' : 'Preview'}
                                          </button>
                                          <button type="button" onClick={() => {
                                            const newAttachments = testForm.attachments.filter((_, i) => i !== idx);
                                            setTestForm({...testForm, attachments: newAttachments});
                                            if (previewAttachmentUrl === file.url) setPreviewAttachmentUrl(null);
                                          }} className="text-rose-500 hover:text-rose-700 font-bold text-xs bg-rose-50 px-3 py-1.5 rounded-lg">Remove</button>
                                        </div>
                                      </div>
                                      {previewAttachmentUrl === file.url && (
                                        <div className="w-full h-48 mt-2 border-2 border-slate-100 rounded-lg overflow-hidden relative bg-slate-50 flex items-center justify-center">
                                          {file.url.includes('image') || file.url.startsWith('data:image') ? (
                                            <img src={file.url} alt="Preview" className="w-full h-full object-contain" />
                                          ) : file.url.includes('pdf') || file.url.startsWith('data:application/pdf') ? (
                                            <iframe src={file.url} className="w-full h-full border-0" title="PDF Preview"></iframe>
                                          ) : (
                                            <p className="text-xs text-slate-400 font-bold">Preview not available.</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
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

                      <div className="flex gap-3 mt-6">
                        <button type="button" onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-colors">
                          Cancel
                        </button>
                        <button type="submit" className="flex-1 bg-[#1B2559] hover:bg-rose-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg transform hover:-translate-y-1">
                          Schedule Test
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* TESTS TRACKER BOARD (TABLE VIEW) */}
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-100 pb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-rose-500 w-2 h-8 rounded-full"></div>
                    <h2 className="text-2xl font-black text-[#1B2559]">Scheduled Tests</h2>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-wrap justify-end">
                    <div className="relative">
                      <svg className="w-5 h-5 absolute left-4 top-3 text-[#A3AED0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      <input type="text" placeholder="Search tests..." 
                        className="w-full sm:w-72 p-3 pl-12 bg-[#F4F7FE] border-none rounded-xl outline-none focus:ring-4 focus:ring-rose-500/10 font-bold text-[#1B2559]"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    <button onClick={() => {
                      setTestForm({ title: '', weekNo: '', topic: '', type: 'File', studentId: '', difficulty: 'Easy', startDate: '', dueDate: '', fileUrl: '', attachments: [], content: '', studentInstructions: '', mcqs: [{ question: '', options: ['', '', '', ''], correctOption: 0 }]});
                      setIsAssignModalOpen(true);
                    }} className="px-6 py-3 font-black rounded-xl shadow-lg transition-transform flex items-center justify-center gap-2 whitespace-nowrap bg-rose-500 hover:bg-rose-600 text-white hover:-translate-y-1">
                      <span>+</span> Schedule New Test
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 sm:items-end">
                  <div className="flex-1 min-w-[110px]">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Filter by Year</label>
                    <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm"
                      value={hwYearFilter} onChange={e => { setHwYearFilter(e.target.value); setHwStudentFilter('all'); }}>
                      <option value="all">All Years</option>
                      {[...new Set(students.map(s => s.yearGroup).filter(Boolean))].map(yg => (
                        <option key={yg} value={yg}>{yg}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-[1.5] min-w-[150px]">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Filter by Student</label>
                    <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm"
                      value={hwStudentFilter} onChange={e => setHwStudentFilter(e.target.value)}>
                      <option value="all">All Filtered Students</option>
                      {students
                        .filter(s => hwYearFilter === 'all' || s.yearGroup === hwYearFilter)
                        .sort((a, b) => (a.registrationName || a.name || '').localeCompare(b.registrationName || b.name || ''))
                        .map(s => (
                        <option key={s._id} value={s._id}>{s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1 min-w-[110px]">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Filter by Status</label>
                    <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm"
                      value={hwStatusFilter} onChange={e => setHwStatusFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Submitted">Submitted (Review)</option>
                      <option value="Graded">Graded</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto w-full max-w-full pb-4 relative max-h-[600px] custom-scrollbar">
                  <table className="w-full min-w-[1000px] text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-rose-500 text-white text-xs font-black uppercase tracking-wider sticky top-0 z-10 align-top shadow-sm">
                        <th className="p-4 rounded-tl-2xl cursor-pointer hover:bg-rose-600 transition-colors" onClick={() => handleSortHomework('title')}>
                          Test Details {hwSortConfig.key === 'title' ? (hwSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-rose-600 transition-colors" onClick={() => handleSortHomework('student')}>
                          Assigned To {hwSortConfig.key === 'student' ? (hwSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 text-center cursor-pointer hover:bg-rose-600 transition-colors" onClick={() => handleSortHomework('difficulty')}>
                          Difficulty {hwSortConfig.key === 'difficulty' ? (hwSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-rose-600 transition-colors" onClick={() => handleSortHomework('dueDate')}>
                          Schedule {hwSortConfig.key === 'dueDate' ? (hwSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-rose-600 transition-colors" onClick={() => handleSortHomework('status')}>
                          Status {hwSortConfig.key === 'status' ? (hwSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 rounded-tr-2xl text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTests.map((hw, index) => {
                        const isLate = new Date() > new Date(hw.dueDate);
                        
                        return (
                          <tr key={hw._id} className={`border-b border-slate-200 hover:bg-slate-200 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-rose-50/30'}`}>
                            <td className="p-4 whitespace-normal min-w-[200px] leading-snug">
                              <h3 className="font-black text-[#1B2559]">{formatTaskTitle(hw.title)}</h3>
                              <p className="text-xs font-bold text-slate-500 mt-1">Format: {hw.type}</p>
                            </td>
                            <td className="p-4 font-black text-[#1B2559]">
                              {hw.studentId ? `${hw.studentId.registrationName || hw.studentId.name} ${hw.studentId.yearGroup ? `(${hw.studentId.yearGroup})` : ''}` : "All Students"}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-wider bg-white border ${hw.difficulty === 'Easy' ? 'text-emerald-500 border-emerald-200' : hw.difficulty === 'Medium' ? 'text-amber-500 border-amber-200' : 'text-rose-500 border-rose-200'}`}>
                                {hw.difficulty || 'Medium'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1 text-xs font-black">
                                <span className="text-emerald-600">Opens: {new Date(hw.startDate).toLocaleString()}</span>
                                <span className="text-rose-500">Closes: {new Date(hw.dueDate).toLocaleString()}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col items-start gap-1.5">
                                <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider
                                  ${hw.status === 'Pending' ? 'bg-slate-100 text-slate-500' : 
                                    hw.status === 'Submitted' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {hw.status}
                                </span>
                                {isLate && hw.status === 'Pending' && (
                                  <span className="bg-rose-100 text-rose-600 px-2 py-1 rounded-md text-[10px] font-black">
                                    Overdue by {getOverdueTime(hw.dueDate)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                               <div className="flex flex-row flex-nowrap items-center justify-center gap-2 w-max mx-auto">
                                  {hw.status === 'Pending' && (
  <>
    <button onClick={() => setModal({ type: 'extend', hwId: hw._id, data: getDefaultDueDate() })} className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 font-black rounded-lg hover:bg-rose-50 transition-all shadow-sm text-xs">
      Extend
    </button>
    <button onClick={() => setModal({ type: 'adminSubmit', hwId: hw._id, data: hw })} className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 font-black rounded-lg hover:bg-rose-100 transition-all shadow-sm text-xs">
      Submit Work
    </button>
  </>
)}
                                  
                                  {hw.status === 'Submitted' && (
                                    <>
                                      <button onClick={() => setModal({ type: 'viewOriginalWork', data: hw })} className="px-3 py-1.5 bg-sky-50 border border-sky-200 text-sky-600 font-black rounded-lg hover:bg-sky-100 transition-colors shadow-sm text-xs whitespace-nowrap">
                                        View Assigned Work
                                      </button>
                                      {hw.submission && (hw.submission.answerFileUrl || hw.submission.answerText || (hw.submission.attachments && hw.submission.attachments.length > 0)) && (
                                        <button onClick={() => setModal({ type: 'viewWork', hwId: hw._id, data: hw.submission, title: hw.title, student: hw.studentId })} className="px-3 py-1.5 bg-[#1B2559] text-white font-black rounded-lg hover:bg-indigo-900 transition-colors shadow-sm text-xs whitespace-nowrap">
                                          View SW
                                        </button>
                                      )}
                                      <button onClick={() => setModal({ type: 'grade', hwId: hw._id, data: { score: '', totalScore: '', driveLink: hw.driveLink || '', feedback: '' } })} className="px-3 py-1.5 bg-emerald-500 text-white font-black rounded-lg hover:bg-emerald-600 transition-transform hover:-translate-y-1 shadow-sm text-xs flex items-center gap-1 whitespace-nowrap">
                                        Grade
                                      </button>
                                    </>
                                  )}
                                  
                                  {hw.status === 'Graded' && (
                                    <div className="flex items-center gap-2">
                                      {user?.role === 'admin' ? (
                                          <button 
                                        onClick={() => {
                                         setModal({ type: 'grade', hwId: hw._id, data: { score: hw.grading?.score ?? '', totalScore: hw.grading?.totalScore ?? '', driveLink: hw.driveLink || '', feedback: hw.grading?.feedback || '', adminAnswerSheetUrl: hw.grading?.adminAnswerSheetUrl || '' } });
                                          if (hw.grading?.adminAnswerSheetUrl || (hw.grading?.adminAttachments && hw.grading.adminAttachments.length > 0)) {
                                            setAnswerSheet({ 
                                                fileUrl: hw.grading.adminAnswerSheetUrl || '', 
                                                fileName: 'Existing Marked/Checked work Attached', 
                                                attachments: hw.grading.adminAttachments || [], 
                                                isUploading: false 
                                            });
                                          } else {
                                            setAnswerSheet({ fileUrl: '', fileName: '', attachments: [], isUploading: false });
                                          }
                                        }}
                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-black border border-emerald-200 text-xs transition-colors shadow-sm"
                                      >
                                            {hw.grading?.score != null ? `${hw.grading.score}/${hw.grading.totalScore} ✏️` : 'Edit'}
                                          </button>
                                      ) : (
                                        <div className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg font-black border border-slate-200 text-xs shadow-sm cursor-not-allowed">
                                          {hw.grading?.score != null ? `${hw.grading.score}/${hw.grading.totalScore} 🔒` : 'Marked 🔒'}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {user?.role === 'admin' && (
                                    <button onClick={() => setModal({ type: 'delete', hwId: hw._id, data: '' })} className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors shadow-sm" title="Delete">
                                      🗑️
                                    </button>
                                  )}
                               </div>
                            </td>
                          </tr>
                        );
                      })}
                      
                      {filteredTests.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center py-20">
                            <div className="flex flex-col items-center justify-center">
                              <div className="text-6xl mb-4 opacity-50">📋</div>
                              <p className="text-[#1B2559] font-black text-xl mb-1">No tests scheduled!</p>
                              <p className="text-[#A3AED0] font-bold">Create a new test using the button above.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 md:mt-0">
                  <div className="relative w-full sm:w-64">
                    <svg className="w-5 h-5 absolute left-3 top-3.5 text-[#A3AED0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input type="text" placeholder="Search students..." 
                      className="w-full p-3 pl-10 bg-[#F4F7FE] border-none rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-[#1B2559]"
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <button onClick={handleExportCSV} className="w-full sm:w-auto justify-center px-5 py-3 bg-slate-50 text-slate-700 hover:bg-slate-700 hover:text-white font-black rounded-xl transition-colors shadow-sm flex items-center gap-2 border border-slate-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Export CSV
                  </button>
                  <button onClick={handleExportPDF} className="w-full sm:w-auto justify-center px-5 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white font-black rounded-xl transition-colors shadow-sm flex items-center gap-2 border border-indigo-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Export PDF
                  </button>
                </div>
              </div>

              {pendingStudents.length > 0 && (
                <div className="mb-10 bg-amber-50/50 border border-amber-200 rounded-[2rem] p-6 shadow-inner">
                  <h3 className="text-lg font-black text-amber-600 mb-4 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                    Requires Approval ({pendingStudents.length})
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {pendingStudents.map(student => (
                      <div key={student._id} className="bg-white p-5 rounded-2xl flex flex-col gap-4 shadow-sm border border-amber-100 hover:shadow-md transition-shadow">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-black text-[#1B2559] text-lg">{student.name}</h4>
                            {student.yearGroup && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-md">{student.yearGroup}</span>}
                          </div>
                          <p className="text-xs font-bold text-[#A3AED0]">{student.email}</p>
                        </div>
                        <div className="flex gap-2 w-full mt-2">
                          <button 
                            onClick={() => handleRejectStudent(student._id)}
                            className="flex-[1] bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200 hover:border-transparent font-black py-3 rounded-xl transition-all shadow-sm text-sm"
                          >
                            Reject
                          </button>
                          <button 
                            onClick={() => handleApproveStudent(student._id)}
                            className="flex-[2] bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl transition-all shadow-sm text-sm"
                          >
                            Allow Access
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="overflow-x-auto w-full max-w-full pb-4 relative mt-6">
                <table className="w-full min-w-[1000px] text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#F4F7FE] text-[#A3AED0] text-xs font-black uppercase tracking-wider">
                      <th className="p-5 rounded-tl-2xl">Student Details</th>
                      <th className="p-5">Email Address</th>
                      <th className="p-5">Task Status</th>
                      <th className="p-5 rounded-tr-2xl w-64">Average Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...students]
                      .filter(student => {
                        if (!searchTerm) return true;
                        const term = searchTerm.toLowerCase();
                        return (student.registrationName || student.name || '').toLowerCase().includes(term) ||
                               (student.email || '').toLowerCase().includes(term);
                      })
                      .sort((a, b) => {
                        const nameA = a.registrationName || a.name || '';
                        const nameB = b.registrationName || b.name || '';
                        return nameA.localeCompare(nameB);
                      })
                      .map(student => {
                      const studentHw = homeworks.filter(h => h.studentId?._id === student._id);
                      const completedCount = studentHw.filter(h => h.status === 'Graded').length;
                      const pendingCount = studentHw.filter(h => h.status === 'Submitted').length;
                      const overdueCount = studentHw.filter(h => h.status === 'Pending' && new Date(h.dueDate) < new Date()).length;
                      const pendingTasksCount = studentHw.filter(h => h.status === 'Pending' && new Date(h.dueDate) >= new Date()).length;
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
                        <tr key={student._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-5">
                            <div className="flex items-center gap-4">
                              {student.profilePic ? (
                                <img 
                                  src={student.profilePic} 
                                  alt={student.name} 
                                  className="w-12 h-12 rounded-full object-cover shadow-md shrink-0 border-2 border-indigo-100 cursor-pointer hover:opacity-80 transition-opacity" 
                                  onClick={() => setFullScreenImage(student.profilePic)}
                                  title="Click to view full image"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-[#1B2559] text-base">{student.registrationName || student.name}</span>
                                  {student.yearGroup && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-md">{student.yearGroup}</span>}
                                  
                                  {editingBoardId === student._id ? (
                                    <div className="flex items-center gap-1">
                                      <input type="text" className="px-2 py-1 text-xs border border-indigo-300 rounded outline-none w-28" value={editBoardName} onChange={e => setEditBoardName(e.target.value)} placeholder="Enter Board Name" autoFocus />
                                      <button onClick={() => handleUpdateBoard(student._id)} className="text-emerald-500 hover:text-emerald-600 bg-emerald-50 p-1 rounded">✅</button>
                                      <button onClick={() => setEditingBoardId(null)} className="text-rose-500 hover:text-rose-600 bg-rose-50 p-1 rounded">❌</button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      {student.boardName && <span className="bg-sky-100 text-sky-700 text-[10px] font-black px-2 py-0.5 rounded-md">{student.boardName}</span>}
                                      <button onClick={() => {setEditingBoardId(student._id); setEditBoardName(student.boardName || '');}} className="text-slate-400 hover:text-indigo-600 transition-colors ml-1" title="Edit Board">✏️</button>
                                    </div>
                                  )}
                                </div>
                                {(student.schoolName || student.city) && (
                                  <span className="text-xs font-bold text-slate-500 mt-1">
                                    {[student.schoolName, student.city].filter(Boolean).join(', ')}
                                  </span>
                                )}
                                {student.studentId && (
                                  <span className="text-[11px] font-black text-indigo-400 mt-0.5 tracking-wide uppercase">
                                    ID: {student.studentId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700">{student.email}</span>
                              {student.phone && (
                                <span className="text-xs font-bold text-slate-500 mt-1">{student.phone}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2 w-[180px]">
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-lg text-center">
                              {completedCount} Completed
                            </span>
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-1 rounded-lg text-center">
                              {pendingTasksCount} Pending
                            </span>
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-lg text-center">
                              {pendingCount} To Mark
                            </span>
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-1 rounded-lg text-center">
                              {overdueCount} Overdue
                            </span>
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="w-full bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                              <div className="flex justify-between text-xs font-black text-[#A3AED0] mb-2">
                                <span>Score</span>
                                <span className={avgScore >= 80 ? 'text-emerald-500' : avgScore >= 50 ? 'text-amber-500' : 'text-rose-500'}>{avgScore}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className={`h-2 rounded-full ${avgScore >= 80 ? 'bg-emerald-500' : avgScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: progressWidth }}></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-10 text-[#A3AED0] font-bold">No students have registered yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                    <div className="relative shrink-0">
                      {settingsForm.profilePic ? (
                        <img src={settingsForm.profilePic} alt="Profile" className="w-24 h-24 rounded-3xl object-cover shadow-md" />
                      ) : (
                        <div className="w-24 h-24 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center text-4xl shadow-md border-2 border-dashed border-slate-300">👤</div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-start gap-2">
                      <div>
                        <h3 className="font-black text-[#1B2559] text-lg">Profile Picture</h3>
                        <p className="text-sm font-bold text-[#A3AED0]">JPG, PNG under 2MB</p>
                      </div>
                      
                      <label className="bg-indigo-50 text-indigo-700 border-2 border-indigo-200 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-colors shadow-sm inline-flex items-center gap-2 mt-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicUpload} />
                        Choose Photo
                      </label>

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
  className="w-full max-w-full truncate p-4 bg-rose-50 text-rose-900 border border-rose-100 rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/20 font-bold"
  value={settingsForm.studentToDelete}
  onChange={e => setSettingsForm({...settingsForm, studentToDelete: e.target.value})}
>
    <option value="">-- Choose a Student --</option>
    {students.sort((a, b) => (a.registrationName || a.name || '').localeCompare(b.registrationName || b.name || '')).map(s => (
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

              {/* NEW: Edit Student Details Zone (Admin Only) */}
              {user?.role === 'admin' && (
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex flex-col xl:col-span-2">
                <div className="flex items-center gap-3 mb-8 border-b border-indigo-100 pb-6">
                  <div className="bg-amber-500 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#1B2559]">Edit Student Details</h2>
                </div>

                <div className="space-y-6 flex flex-col h-full">
                  <p className="text-sm font-bold text-slate-500">Modify a student's profile. These changes are visible to Admins and Students.</p>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-amber-500 uppercase tracking-wide">Select a Student to Edit</label>
                    <select
                      className="w-full p-4 bg-amber-50 text-amber-900 border border-amber-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/20 font-bold"
                      value={editStudentForm.id}
                      onChange={e => {
                        const student = students.find(s => s._id === e.target.value);
                        if (student) {
                          setEditStudentForm({
                            id: student._id,
                            name: student.adminOverrides?.name || student.originalName || student.name || '',
                            phone: student.adminOverrides?.phone || student.phone || '',
                            schoolName: student.adminOverrides?.schoolName || student.schoolName || '',
                            city: student.adminOverrides?.city || student.city || ''
                          });
                        } else {
                          setEditStudentForm({ id: '', name: '', phone: '', schoolName: '', city: '' });
                        }
                      }}
                    >
                      <option value="">-- Choose a Student --</option>
                      {students.sort((a, b) => (a.registrationName || a.name || '').localeCompare(b.registrationName || b.name || '')).map(s => (
                        <option key={s._id} value={s._id}>
                          {s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''} ({s.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {editStudentForm.id && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 animate-fade-in">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-[#A3AED0] uppercase">Name</label>
                        <input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-[#1B2559]" value={editStudentForm.name} onChange={e => setEditStudentForm({...editStudentForm, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-[#A3AED0] uppercase">Phone</label>
                        <input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-[#1B2559]" value={editStudentForm.phone} onChange={e => setEditStudentForm({...editStudentForm, phone: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-[#A3AED0] uppercase">School Name</label>
                        <input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-[#1B2559]" value={editStudentForm.schoolName} onChange={e => setEditStudentForm({...editStudentForm, schoolName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-[#A3AED0] uppercase">City</label>
                        <input type="text" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-[#1B2559]" value={editStudentForm.city} onChange={e => setEditStudentForm({...editStudentForm, city: e.target.value})} />
                      </div>

                      <button onClick={handleUpdateStudentDetails} className="md:col-span-2 mt-4 py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-lg transition-transform hover:-translate-y-1">
                        Save Student Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Change Password Section - Only for standard email/password users */}
              {adminProfile.authProvider !== 'google' ? (
                <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex flex-col xl:col-span-2 mt-4">
                  <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                    <div className="bg-indigo-500 w-2 h-8 rounded-full"></div>
                    <h2 className="text-2xl font-black text-[#1B2559]">Change Password</h2>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-6 flex flex-col h-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div className="space-y-2">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Current Password</label>
                        <div className="relative">
                          <input type={showPasswords.current ? "text" : "password"} required className="w-full p-4 pr-12 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold text-[#1B2559]" 
                            value={passwordForm.currentPassword} onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})} />
                          <button type="button" onClick={() => togglePassword('current')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 outline-none">
                            {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">New Password</label>
                        <div className="relative">
                          <input type={showPasswords.new ? "text" : "password"} required className="w-full p-4 pr-12 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold text-[#1B2559]" 
                            value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} />
                          <button type="button" onClick={() => togglePassword('new')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 outline-none">
                            {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Confirm New Password</label>
                        <div className="relative">
                          <input type={showPasswords.confirm ? "text" : "password"} required className="w-full p-4 pr-12 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold text-[#1B2559]" 
                            value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} />
                          <button type="button" onClick={() => togglePassword('confirm')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 outline-none">
                            {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                    </div>

                    <button type="submit" className="w-full mt-2 py-4 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-2xl shadow-lg transition-transform hover:-translate-y-1">
                      Update Password
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex flex-col xl:col-span-2 mt-4 text-center">
                  <p className="text-indigo-900 font-bold text-sm">
                    🔒 You are signed in via Google. Password management is handled by your Google account.
                  </p>
                </div>
              )}
              {/* Admin Feedback */}
              {user?.role === 'admin' && (
                <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] flex flex-col xl:col-span-2 mt-4 min-h-[600px]">
                  <div className="flex items-center gap-3 mb-8 border-b border-indigo-100 pb-6">
                    <div className="bg-indigo-500 w-2 h-8 rounded-full"></div>
                    <h2 className="text-2xl font-black text-[#1B2559]">All Feedbacks</h2>
                  </div>

                  <div className="overflow-x-auto w-full max-w-full pb-4 relative custom-scrollbar flex-1">
                    <table className="w-full min-w-[1000px] text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-[#F4F7FE] text-[#A3AED0] text-xs font-black uppercase tracking-wider sticky top-0 z-10">
                          <th className="p-5 rounded-tl-2xl">User Details</th>
                          <th className="p-5">Feature</th>
                          <th className="p-5">Rating</th>
                          <th className="p-5 w-[400px]">Message</th>
                          <th className="p-5">Status / Date</th>
                          <th className="p-5 rounded-tr-2xl text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allFeedback.map(fb => (
                          <tr key={fb._id} className={`border-b border-slate-100 transition-colors ${fb.isReviewed ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/30 hover:bg-indigo-50/60'}`}>
                            
                            {/* User Details */}
                            <td className="p-5">
                              <p className="font-black text-base text-[#1B2559]">{fb.user?.name || 'Unknown User'}</p>
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 inline-block
                                ${fb.user?.role === 'parent' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {fb.user?.role || 'N/A'}
                              </span>
                            </td>

                            {/* Feature */}
                            <td className="p-5">
                              <span className="text-xs font-black text-sky-700 bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-200 shadow-sm whitespace-nowrap">
                                📂 {fb.feature}
                              </span>
                            </td>

                            {/* Rating */}
                            <td className="p-5">
                              <div className="flex text-lg drop-shadow-sm">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={i < fb.rating ? 'text-amber-400' : 'text-slate-200'}>★</span>
                                ))}
                              </div>
                            </td>

                            {/* Message */}
                            <td className="p-5 w-[400px] whitespace-normal">
                              <p className="text-sm font-bold text-slate-600 bg-white p-3 rounded-xl border border-slate-200/60 shadow-inner">
                                "{fb.message}"
                              </p>
                            </td>

                            {/* Status & Date */}
                            <td className="p-5">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full block w-fit mb-2 shadow-sm border
                                ${fb.isReviewed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'}`}>
                                {fb.isReviewed ? '✅ Reviewed' : '⏳ Pending'}
                              </span>
                              <span className="text-xs font-bold text-slate-400 whitespace-nowrap block mt-1">
                                {new Date(fb.createdAt).toLocaleDateString()} {new Date(fb.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="p-5 text-center">
                              <div className="flex flex-col items-center gap-2">
                                {!fb.isReviewed && (
                                  <button 
                                    type="button" 
                                    onClick={() => handleMarkFeedbackReviewed(fb)} 
                                    className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-black transition-transform hover:-translate-y-1 shadow-md text-xs whitespace-nowrap"
                                    title="Mark as Reviewed & Send automated Thank You"
                                  >
                                    ✓ Review & Reply
                                  </button>
                                )}
                                <button 
                                  type="button" 
                                  onClick={() => handleDeleteFeedback(fb._id)} 
                                  className="w-full py-2 px-4 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg font-black transition-colors shadow-sm text-xs border border-rose-200 whitespace-nowrap"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </td>

                          </tr>
                        ))}
                        {allFeedback.length === 0 && (
                          <tr>
                            <td colSpan="6" className="text-center py-20">
                              <div className="flex flex-col items-center justify-center">
                                <span className="text-6xl mb-4 opacity-50">📬</span>
                                <p className="font-bold text-slate-400">No feedback submitted yet.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* ANNOUNCEMENTS TAB */}
          {activeTab === 'announcements' && (
            <div className="animate-fade-in relative">
              
              {isAssignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                  <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl transform scale-100 animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                      <div className="bg-amber-500 w-2 h-8 rounded-full"></div>
                      <h2 className="text-2xl font-black text-[#1B2559]">Post Announcement</h2>
                    </div>
                    
                    <form onSubmit={async (e) => {
                      await handleAnnouncementSubmit(e);
                      setIsAssignModalOpen(false);
                    }} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Message Content</label>
                        <textarea className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/20 font-bold text-[#1B2559] min-h-[140px]" 
                          placeholder="e.g., Tomorrow's class is rescheduled..." required value={announcementForm.content}
                          onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Target Audience</label>
                        <select className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559] truncate max-w-full" 
                        value={announcementForm.targetAudience} onChange={e => setAnnouncementForm({...announcementForm, targetAudience: e.target.value})}>
                          <option value="">-- Choose a Student --</option>
                          {students.sort((a, b) => (a.registrationName || a.name || '').localeCompare(b.registrationName || b.name || '')).map(s => <option key={s._id} value={s._id}>👤 {s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}</option>)}
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

                      <div className="flex gap-3 mt-6">
                        <button type="button" onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-colors">
                          Cancel
                        </button>
                        <button type="submit" className="flex-1 bg-[#1B2559] hover:bg-amber-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg transform hover:-translate-y-1">
                          Broadcast Message
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* ANNOUNCEMENTS TRACKER BOARD */}
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500 w-2 h-8 rounded-full"></div>
                    <h2 className="text-2xl font-black text-[#1B2559]">Notice Board History</h2>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-wrap justify-end">
                    <div className="relative">
                      <svg className="w-5 h-5 absolute left-4 top-3 text-[#A3AED0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      <input type="text" placeholder="Search announcements..." 
                        className="w-full sm:w-64 p-3 pl-12 bg-[#F4F7FE] border-none rounded-xl outline-none focus:ring-4 focus:ring-amber-500/10 font-bold text-[#1B2559]"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    <button onClick={() => {
                      setAnnouncementForm({ content: '', targetAudience: '', imageUrl: '' });
                      setIsAssignModalOpen(true);
                    }} className="px-6 py-3 font-black rounded-xl shadow-lg transition-transform flex items-center justify-center gap-2 whitespace-nowrap bg-amber-500 hover:bg-amber-600 text-white hover:-translate-y-1">
                      <span>+</span> Post Announcement
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 sm:items-end">
                  <div className="flex-1 min-w-[110px]">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Filter by Year</label>
                    <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm"
                      value={hwYearFilter} onChange={e => { setHwYearFilter(e.target.value); setHwStudentFilter('all'); }}>
                      <option value="all">All Years</option>
                      {[...new Set(students.map(s => s.yearGroup).filter(Boolean))].map(yg => (
                        <option key={yg} value={yg}>{yg}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-[1.5] min-w-[150px]">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Filter by Student</label>
                    <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm"
                      value={hwStudentFilter} onChange={e => setHwStudentFilter(e.target.value)}>
                      <option value="all">All Filtered Students</option>
                      {students
                        .filter(s => hwYearFilter === 'all' || s.yearGroup === hwYearFilter)
                        .sort((a, b) => (a.registrationName || a.name || '').localeCompare(b.registrationName || b.name || ''))
                        .map(s => (
                        <option key={s._id} value={s._id}>{s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto w-full max-w-full pb-4 relative flex-1 custom-scrollbar">
                  <table className="w-full min-w-[1000px] text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-amber-500 text-white text-xs font-black uppercase tracking-wider sticky top-0 z-10 align-top shadow-sm">
                        <th className="p-4 rounded-tl-2xl">Message Content</th>
                        <th className="p-4">Target Audience</th>
                        <th className="p-4">Date Posted</th>
                        <th className="p-4">Read Receipts</th>
                        <th className="p-4 rounded-tr-2xl text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {announcements
                        .filter(ann => {
                          const searchLower = (searchTerm || '').toLowerCase();
                          const matchesSearch = ann.content?.toLowerCase().includes(searchLower) || 
                                              (ann.targetAudience !== 'all' && students.find(s => s._id === ann.targetAudience)?.name.toLowerCase().includes(searchLower));
                          
                          if (!matchesSearch) return false;
                          
                          if (hwStudentFilter !== 'all') {
                            if (ann.targetAudience !== 'all' && String(ann.targetAudience) !== String(hwStudentFilter)) return false;
                          } else if (hwYearFilter !== 'all') {
                            if (ann.targetAudience !== 'all') {
                              const targetStudent = students.find(s => s._id === ann.targetAudience);
                              if (!targetStudent || targetStudent.yearGroup !== hwYearFilter) return false;
                            }
                          }
                          return true;
                        })
                        .map((ann, index) => {
                        return (
                          <tr key={ann._id} className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-amber-50/20'}`}>
                            <td className="p-4 whitespace-normal min-w-[300px] leading-snug">
                              <p className="font-bold text-[#1B2559] text-sm whitespace-pre-wrap">{ann.content}</p>
                              {ann.imageUrl && (
                                <img src={ann.imageUrl} alt="Announcement" className="mt-3 w-32 h-auto rounded-lg border-2 border-slate-100 shadow-sm cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setFullScreenImage(ann.imageUrl)} title="Click to view full image" />
                              )}
                            </td>
                            <td className="p-4 font-black text-[#1B2559]">
                              {ann.targetAudience === 'all' 
                                ? (
                                  <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider bg-indigo-100 text-indigo-700 inline-block">
                                    📢 Everyone
                                  </span>
                                )
                                : (() => {
                                    const st = students.find(s => s._id === ann.targetAudience);
                                    return st ? (
                                      <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider bg-amber-100 text-amber-700 inline-block">
                                        👤 {st.registrationName || st.name} {st.yearGroup ? `(${st.yearGroup})` : ''}
                                      </span>
                                    ) : 'Specific Student';
                                  })()
                              }
                            </td>
                            <td className="p-4">
                              <span className="text-xs font-bold text-slate-500">{new Date(ann.createdAt).toLocaleString()}</span>
                            </td>
                            <td className="p-4 whitespace-normal min-w-[200px]">
                              <p className="text-xs font-black text-emerald-600 mb-1.5">Read by {ann.readBy?.length || 0} student(s)</p>
                              <div className="flex flex-wrap gap-1">
                                {ann.readBy?.map(student => (
                                  <span key={student._id} className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] px-2 py-0.5 rounded font-bold shadow-sm">
                                    {student.registrationName || student.name}
                                  </span>
                                ))}
                                {(!ann.readBy || ann.readBy.length === 0) && <span className="text-slate-400 text-xs font-bold">-</span>}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <button onClick={() => handleDeleteAnnouncement(ann._id)} className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors shadow-sm" title="Delete Announcement">
                                🗑️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      
                      {announcements.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center py-20">
                            <div className="flex flex-col items-center justify-center">
                              <div className="text-6xl mb-4 opacity-50">📢</div>
                              <p className="text-[#1B2559] font-black text-xl mb-1">No Announcements Found!</p>
                              <p className="text-[#A3AED0] font-bold">Post a new message to your students using the button above.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {/* SCHEME OF WORK TAB */}
          {activeTab === 'scheme' && (
            <div className="animate-fade-in relative">

              {/* SCHEME MODAL (POPUP) */}
              {isSchemeModalOpen && user?.role === 'admin' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                  <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl transform scale-100 animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                      <div className="bg-fuchsia-500 w-2 h-8 rounded-full"></div>
                      <h2 className="text-2xl font-black text-[#1B2559]">
                        {editingSchemeId ? 'Edit Daily Report' : 'Add Daily Report'}
                      </h2>
                    </div>

                    <form onSubmit={handleSchemeInitialSubmit} className="space-y-4">
                      <div className="mb-4">
                        <label className="text-xs font-black text-[#A3AED0] uppercase">Date</label>
                        <input type="date" required className="w-full p-4 mt-1 bg-[#F4F7FE] border-none rounded-xl font-bold text-[#1B2559] outline-none" value={schemeForm.date} onChange={e => setSchemeForm({...schemeForm, date: e.target.value})} />
                      </div>

                      <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl mb-4 border border-slate-100">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Class Status</label>
                        
                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                          <input type="radio" name="classStatus" value="Class Taken" 
                            checked={schemeForm.classStatus === 'Class Taken'} 
                            onChange={e => setSchemeForm({...schemeForm, classStatus: e.target.value, title: schemeForm.weekNo && schemeForm.topic ? `WEEK ${schemeForm.weekNo} - ${schemeForm.topic}`.toUpperCase() : ''})} 
                            className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                          <span className="font-bold text-slate-700 text-sm">✅ Class Taken</span>
                        </label>
                        
                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                          <input type="radio" name="classStatus" value="Class Cancelled by Teacher" 
                            checked={schemeForm.classStatus === 'Class Cancelled by Teacher'} 
                            onChange={e => setSchemeForm({...schemeForm, classStatus: e.target.value, title: 'CANCELLED BY TEACHER'})} 
                            className="w-5 h-5 text-rose-600 focus:ring-rose-500 cursor-pointer" />
                          <span className="font-bold text-slate-700 text-sm">❌ Class Cancelled by Teacher</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                          <input type="radio" name="classStatus" value="Class Cancelled by Student" 
                            checked={schemeForm.classStatus === 'Class Cancelled by Student'} 
                            onChange={e => setSchemeForm({...schemeForm, classStatus: e.target.value, title: 'CANCELLED BY STUDENT'})} 
                            className="w-5 h-5 text-rose-600 focus:ring-rose-500 cursor-pointer" />
                          <span className="font-bold text-slate-700 text-sm">❌ Class Cancelled by Student</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                          <input type="radio" name="classStatus" value="Student didn't attend" 
                            checked={schemeForm.classStatus === "Student didn't attend"} 
                            onChange={e => setSchemeForm({...schemeForm, classStatus: e.target.value, title: "STUDENT DIDN'T ATTEND"})} 
                            className="w-5 h-5 text-rose-600 focus:ring-rose-500 cursor-pointer" />
                          <span className="font-bold text-slate-700 text-sm">❌ Student didn't attend</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                          <input type="radio" name="classStatus" value="Class Rescheduled" 
                            checked={schemeForm.classStatus === "Class Rescheduled"} 
                            onChange={e => setSchemeForm({...schemeForm, classStatus: e.target.value, title: "CLASS RESCHEDULED"})} 
                            className="w-5 h-5 text-amber-600 focus:ring-amber-500 cursor-pointer" />
                          <span className="font-bold text-slate-700 text-sm">🔄 Class Rescheduled</span>
                        </label>
                      </div>

                      <div className="flex flex-col gap-4 mb-6 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        <div>
                          <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Filter by Year Group</label>
                          <select className="w-full p-3 mt-1 bg-white border border-indigo-100 rounded-xl outline-none font-bold text-[#1B2559]"
                            value={schemeForm.yearGroupFilter}
                            onChange={e => {
                              const selectedYear = e.target.value;
                              setSchemeForm({
                                ...schemeForm,
                                yearGroupFilter: selectedYear,
                                studentId: ''
                              });
                            }}>
                            <option value="all">All Years</option>
                            {[...new Set(students.map(s => s.yearGroup).filter(Boolean))].map(yg => (
                              <option key={yg} value={yg}>{yg}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Select Student</label>
                          <select className="w-full p-3 mt-1 bg-white border border-indigo-100 rounded-xl outline-none font-bold text-[#1B2559]"
                            value={schemeForm.studentId}
                            onChange={e => setSchemeForm({...schemeForm, studentId: e.target.value})}>
                            <option value="">-- Choose a Student --</option>
                            {students.filter(s => schemeForm.yearGroupFilter === 'all' || s.yearGroup === schemeForm.yearGroupFilter)
                              .sort((a, b) => (a.registrationName || a.name || '').localeCompare(b.registrationName || b.name || ''))
                              .map(s => (
                              <option key={s._id} value={s._id}>👤 {s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                     {(schemeForm.classStatus === 'Class Taken' || schemeForm.classStatus === "Student didn't attend" || schemeForm.classStatus === 'Class Rescheduled') && (
                        <div className="animate-fade-in space-y-4">
                          
                          {schemeForm.classStatus !== 'Class Rescheduled' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-black text-[#A3AED0] uppercase">{schemeForm.classStatus === "Student didn't attend" ? "Wait Start Time" : "Start Time"}</label>
                                <input type="time" required className="w-full p-4 mt-1 bg-[#F4F7FE] border-none rounded-xl font-bold text-[#1B2559] outline-none" 
                                  value={schemeForm.startTime} 
                                  onChange={e => {
                                    const newStart = e.target.value;
                                    setSchemeForm({
                                      ...schemeForm, 
                                      startTime: newStart, 
                                      endTime: calculateEndTime(newStart) 
                                    });
                                  }} 
                                />
                              </div>
                              <div>
                                <label className="text-xs font-black text-[#A3AED0] uppercase">{schemeForm.classStatus === "Student didn't attend" ? "Wait End Time" : "End Time"}</label>
                                <input type="time" required className="w-full p-4 mt-1 bg-[#F4F7FE] border-none rounded-xl font-bold text-[#1B2559] outline-none" value={schemeForm.endTime} onChange={e => setSchemeForm({...schemeForm, endTime: e.target.value})} />
                              </div>
                            </div>
                          )}

                          {schemeForm.classStatus === 'Class Rescheduled' && (
                            <div className="space-y-4 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                              <div>
                                <label className="text-xs font-black text-amber-800 uppercase block mb-1">New Rescheduled Date</label>
                                <input type="date" required className="w-full p-4 bg-white border border-amber-200 rounded-xl font-bold text-[#1B2559] outline-none" 
                                  value={schemeForm.rescheduledDate ? new Date(schemeForm.rescheduledDate).toISOString().split('T')[0] : ''} 
                                  onChange={e => setSchemeForm({...schemeForm, rescheduledDate: e.target.value})} />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                                <div className="flex flex-col justify-end">
                                  <label className="text-xs font-black text-amber-800 uppercase block mb-1 truncate" title="Rescheduled Start Time">Start Time</label>
                                  <input type="time" required className="w-full p-4 bg-white border border-amber-200 rounded-xl font-bold text-[#1B2559] outline-none" 
                                    value={schemeForm.rescheduledStartTime} 
                                    onChange={e => {
                                      const newStart = e.target.value;
                                      setSchemeForm({
                                        ...schemeForm, 
                                        rescheduledStartTime: newStart, 
                                        rescheduledEndTime: calculateEndTime(newStart)
                                      });
                                    }} />
                                </div>
                                <div className="flex flex-col justify-end">
                                  <label className="text-xs font-black text-amber-800 uppercase block mb-1 truncate" title="Rescheduled End Time">End Time</label>
                                  <input type="time" required className="w-full p-4 bg-white border border-amber-200 rounded-xl font-bold text-[#1B2559] outline-none" 
                                    value={schemeForm.rescheduledEndTime} 
                                    onChange={e => setSchemeForm({...schemeForm, rescheduledEndTime: e.target.value})} />
                                </div>
                              </div>
                            </div>
                          )}

                          {((schemeForm.classStatus === 'Class Rescheduled' && schemeForm.rescheduledStartTime && schemeForm.rescheduledEndTime) || 
                            (schemeForm.classStatus !== 'Class Rescheduled' && schemeForm.startTime && schemeForm.endTime)) && (
                            <div className={`text-sm font-black px-4 py-2 rounded-xl border flex justify-center items-center ${schemeForm.classStatus === "Student didn't attend" ? "text-rose-600 bg-rose-50 border-rose-100" : schemeForm.classStatus === 'Class Rescheduled' ? "text-amber-800 bg-amber-50 border-amber-200" : "text-indigo-600 bg-indigo-50 border-indigo-100"}`}>
                              ⏱️ Total {schemeForm.classStatus === "Student didn't attend" ? "Wait Time" : "Duration"}: {(() => {
                                const start = schemeForm.classStatus === 'Class Rescheduled' ? schemeForm.rescheduledStartTime : schemeForm.startTime;
                                const end = schemeForm.classStatus === 'Class Rescheduled' ? schemeForm.rescheduledEndTime : schemeForm.endTime;
                                const [sh, sm] = start.split(':').map(Number);
                                const [eh, em] = end.split(':').map(Number);
                                let diff = (eh * 60 + em) - (sh * 60 + sm);
                                if(diff < 0) diff += 24 * 60;
                                const h = Math.floor(diff/60);
                                const m = diff % 60;
                                return `${h > 0 ? h + ' hr ' : ''}${m > 0 ? m + ' min' : ''}`.trim();
                              })()}
                            </div>
                          )}

                          <div>
                            <label className="text-xs font-black text-[#A3AED0] uppercase">Lesson Title</label>
                            <input type="text" placeholder="Enter Lesson Title..." className="w-full p-4 mt-1 bg-[#F4F7FE] border-none rounded-xl font-bold text-[#1B2559] outline-none" value={schemeForm.title} onChange={e => setSchemeForm({...schemeForm, title: e.target.value})} />
                          </div>

                          <div>
                            <label className="text-xs font-black text-[#A3AED0] uppercase">Description (Optional)</label>
                            <textarea className="w-full p-4 mt-1 bg-[#F4F7FE] border-none rounded-xl font-bold text-[#1B2559] outline-none min-h-[100px]" placeholder="What was covered today..." value={schemeForm.description} onChange={e => setSchemeForm({...schemeForm, description: e.target.value})} />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 mt-6">
                        <button type="button" onClick={() => { 
                          setIsSchemeModalOpen(false);
                          setEditingSchemeId(null); 
                          setSchemeForm({ date: new Date().toISOString().split('T')[0], startTime: '', endTime: '', title: '', weekNo: '', topic: '', description: '', classStatus: 'Class Taken', yearGroupFilter: 'all', studentId: '' });
                          setGraderInstruction(''); 
                        }} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-xl transition-all shadow-sm">
                          Cancel
                        </button>
                        <button type="submit" className="flex-1 bg-[#1B2559] hover:bg-fuchsia-600 text-white font-black py-4 rounded-xl transition-all shadow-lg">
                          {editingSchemeId ? 'Update Report' : 'Submit Report'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* FULL-WIDTH DATABASE TABLE */}
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-100 pb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-500 w-2 h-8 rounded-full"></div>
                    <h2 className="text-2xl font-black text-[#1B2559]">Lesson Schedule</h2>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-wrap justify-end">
                    {user?.role === 'admin' && schemes.length > 0 && (
                      <button onClick={() => setModal({ type: 'deleteAllSchemes', data: '' })} className="px-4 py-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl font-black transition-all shadow-sm flex items-center gap-2 whitespace-nowrap">
                        🗑️ Delete All
                      </button>
                    )}
                    {user?.role === 'admin' && (
                      <button onClick={() => {
                        setSchemeForm({ date: new Date().toISOString().split('T')[0], startTime: '', endTime: '', title: '', weekNo: '', topic: '', description: '', classStatus: 'Class Taken', yearGroupFilter: 'all', studentId: '' });
                        setEditingSchemeId(null);
                        setIsSchemeModalOpen(true);
                      }} className="px-6 py-3 bg-[#1B2559] hover:bg-fuchsia-600 text-white font-black rounded-xl shadow-lg transition-transform hover:-translate-y-1 flex items-center justify-center gap-2 whitespace-nowrap">
                        <span>+</span> Add Daily Report
                      </button>
                    )}
                  </div>
                </div>

                {/* FILTERS */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex-1">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Filter by Year</label>
                    <select className="w-full p-3 mt-1 bg-white border border-slate-200 rounded-xl outline-none font-bold text-[#1B2559]"
                      value={schemeListYear}
                      onChange={e => {
                        setSchemeListYear(e.target.value);
                        setSchemeListStudent('all');
                      }}>
                      <option value="all">All Years</option>
                      {[...new Set(students.map(s => s.yearGroup).filter(Boolean))].map(yg => (
                        <option key={yg} value={yg}>{yg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Filter by Student</label>
                    <select className="w-full p-3 mt-1 bg-white border border-slate-200 rounded-xl outline-none font-bold text-[#1B2559]"
                      value={schemeListStudent} onChange={e => setSchemeListStudent(e.target.value)}>
                      <option value="all">All Filtered Students</option>
                      {students
                        .filter(s => schemeListYear === 'all' || s.yearGroup === schemeListYear)
                        .sort((a, b) => (a.registrationName || a.name).localeCompare(b.registrationName || b.name))
                        .map(s => (
                        <option key={s._id} value={s._id}>{s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Filter by Status</label>
                    <select className="w-full p-3 mt-1 bg-white border border-slate-200 rounded-xl outline-none font-bold text-[#1B2559]"
                      value={schemeListStatus} onChange={e => setSchemeListStatus(e.target.value)}>
                      <option value="all">All Statuses</option>
                      <option value="Class Taken">Class Taken</option>
                      <option value="Class Cancelled by Teacher">Class Cancelled by Teacher</option>
                      <option value="Class Cancelled by Student">Class Cancelled by Student</option>
                      <option value="Student didn't attend">Student didn't attend</option>
                      <option value="Class Rescheduled">Class Rescheduled</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Filter by Date</label>
                    <input type="date" className="w-full p-3 mt-1 bg-white border border-slate-200 rounded-xl outline-none font-bold text-[#1B2559]"
                      value={schemeListDate} onChange={e => setSchemeListDate(e.target.value)} />
                  </div>
                </div>
                
                <div className="overflow-x-auto w-full max-w-full pb-4 relative max-h-[600px] custom-scrollbar">
                  <table className="w-full min-w-[1000px] text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#F4F7FE] text-[#A3AED0] text-xs font-black uppercase tracking-wider sticky top-0 z-10">
                        <th className="p-5 rounded-tl-2xl">Date</th>
                        <th className="p-5">Lesson Title</th>
                        <th className="p-5">Status</th>
                        <th className="p-5">Time & Duration</th>
                        <th className="p-5 rounded-tr-2xl">Details & Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schemes.filter(report => {
                        if (user?.role === 'grader') {
                          const isAllocated = report.studentId === 'all' || students.some(s => s._id === report.studentId);
                          if (!isAllocated) return false;
                        }
                        
                        if (schemeListYear !== 'all') {
                          if (report.studentId && report.studentId !== 'all') {
                            const studentForReport = students.find(s => s._id === report.studentId);
                            if (!studentForReport || studentForReport.yearGroup !== schemeListYear) {
                              return false;
                            }
                          } else {
                            if (report.yearGroupFilter !== 'all' && report.yearGroupFilter !== schemeListYear) {
                              return false;
                            }
                          }
                        }
                        
                        if (schemeListStudent !== 'all' && report.studentId !== 'all' && report.studentId !== schemeListStudent) return false;
                        
                        if (schemeListStatus !== 'all' && report.classStatus !== schemeListStatus) return false;

                        if (schemeListDate) {
                          const reportDate = new Date(report.date).toISOString().split('T')[0];
                          if (reportDate !== schemeListDate) return false;
                        }
                        
                        return true;
                      }).map(report => (
                        <tr key={report._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-5">
                            <p className="font-bold text-[#1B2559]">
                              {new Date(report.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </td>
                          <td className="p-5 whitespace-normal leading-snug min-w-[160px]">
                            {report.title && (
                              <p className="font-bold text-[#1B2559] mb-1">
                                {(() => {
                                  const words = (report.title || '').trim().split(/\s+/);
                                  if (words.length > 3) {
                                    return (
                                      <>
                                        {words.slice(0, 3).join(' ')}
                                        <br />
                                        {words.slice(3).join(' ')}
                                      </>
                                    );
                                  }
                                  return report.title;
                                })()}
                              </p>
                            )}
                            {report.studentId && report.studentId !== 'all' ? (
                              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                👤 {students.find(s => s._id === report.studentId)?.name || 'Specific Student'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                📢 Entire Class
                              </span>
                            )}
                          </td>
                          <td className="p-5">
                            <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider shadow-sm ${
                              report.classStatus === 'Class Taken' ? 'bg-emerald-100 text-emerald-700' : 
                              report.classStatus === 'Class Rescheduled' ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {report.classStatus === 'Class Taken' ? '✅ Class Taken' : 
                               report.classStatus === 'Class Rescheduled' ? '🔄 Rescheduled' : 
                               `❌ ${report.classStatus}`}
                            </span>
                          </td>
                          <td className="p-5">
                            {report.classStatus === 'Class Rescheduled' && report.rescheduledStartTime && report.rescheduledEndTime ? (
                              <div>
                                <p className="text-sm font-bold px-2 py-1 rounded-md inline-block mb-1 border text-amber-800 bg-amber-50 border-amber-200">
                                  {report.rescheduledStartTime} - {report.rescheduledEndTime}
                                </p>
                                <p className="text-xs font-bold text-amber-700 block">
                                  Duration: {
                                    (() => {
                                      const [sh, sm] = report.rescheduledStartTime.split(':').map(Number);
                                      const [eh, em] = report.rescheduledEndTime.split(':').map(Number);
                                      let diff = (eh * 60 + em) - (sh * 60 + sm);
                                      if(diff < 0) diff += 24 * 60;
                                      const h = Math.floor(diff/60);
                                      const m = diff % 60;
                                      return `${h > 0 ? h + ' hr ' : ''}${m > 0 ? m + ' min' : ''}`.trim();
                                    })()
                                  }
                                </p>
                              </div>
                            ) : (report.classStatus === 'Class Taken' || report.classStatus === "Student didn't attend") && report.startTime && report.endTime ? (
                              <div>
                                <p className={`text-sm font-bold px-2 py-1 rounded-md inline-block mb-1 border ${report.classStatus === "Student didn't attend" ? 'text-rose-700 bg-rose-50 border-rose-100' : 'text-indigo-700 bg-indigo-50 border-indigo-100'}`}>
                                  {report.startTime} - {report.endTime}
                                </p>
                                <p className="text-xs font-bold text-slate-500 block">
                                  {report.classStatus === "Student didn't attend" ? "Waited" : "Duration"}: {
                                    (() => {
                                      const [sh, sm] = report.startTime.split(':').map(Number);
                                      const [eh, em] = report.endTime.split(':').map(Number);
                                      let diff = (eh * 60 + em) - (sh * 60 + sm);
                                      if(diff < 0) diff += 24 * 60;
                                      const h = Math.floor(diff/60);
                                      const m = diff % 60;
                                      return `${h > 0 ? h + ' hr ' : ''}${m > 0 ? m + ' min' : ''}`.trim();
                                    })()
                                  }
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-5 w-[350px] whitespace-normal">
                            <div className="flex justify-between items-center gap-4 group p-2 -m-2 rounded-xl hover:bg-slate-50 transition-colors">
                              <div className="flex-1 min-w-0">
                                {report.description ? (
                                  <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap mb-2" title="Description">
                                    {report.description}
                                  </p>
                                ) : (
                                  <p className="text-sm text-slate-400 font-medium mb-2">-</p>
                                )}
                                
                                {report.classStatus === "Student didn't attend" && report.waitingTime && (
                                  <div className="bg-rose-50 border-l-4 border-rose-500 p-2 rounded-r-lg mt-2 mb-2">
                                    <p className="text-[10px] font-black text-rose-800 uppercase mb-0.5">Waiting Time:</p>
                                    <p className="text-rose-900 font-medium text-xs">{report.waitingTime}</p>
                                  </div>
                                )}
                                
                                {(user?.role === 'admin' || user?.role === 'grader') && report.graderInstruction && (
                                  <div className="bg-indigo-50 border-l-4 border-indigo-500 p-2 rounded-r-lg">
                                    <p className="text-[10px] font-black text-indigo-800 uppercase mb-0.5">Grader Instructions:</p>
                                    <p className="text-indigo-900 font-medium text-xs line-clamp-2" title={report.graderInstruction}>{report.graderInstruction}</p>
                                  </div>
                                )}
                              </div>

                              {user?.role === 'admin' && (
                                <div className="flex flex-col gap-2 shrink-0 mt-1">
                                  <button onClick={() => {
                                    setSchemeForm({
                                      date: new Date(report.date).toISOString().split('T')[0],
                                      startTime: report.startTime || '',
                                      endTime: report.endTime || '',
                                      title: report.title || '',
                                      weekNo: report.weekNo || '',
                                      topic: report.topic || '',
                                      description: report.description || '',
                                      classStatus: report.classStatus || 'Class Taken',
                                      waitingTime: report.waitingTime || '',
                                      yearGroupFilter: report.yearGroupFilter || 'all',
                                      studentId: report.studentId || 'all'
                                    });
                                    setGraderInstruction(report.graderInstruction || '');
                                    setEditingSchemeId(report._id);
                                    setIsSchemeModalOpen(true);
                                  }} className="p-2 bg-indigo-50 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-lg shadow-sm transition-all" title="Edit Report">
                                    ✏️
                                  </button>
                                  <button onClick={() => setModal({ type: 'deleteScheme', hwId: report._id, data: '' })} 
                                    className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg shadow-sm transition-all" title="Delete Report">
                                    🗑️
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {schemes.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center py-10 text-slate-400 font-bold">No daily reports recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: ANALYTICS TAB */}
          {activeTab === 'analytics' && (() => {
            // 1. Task Completion Breakdown
            const studentHwForPie = selectedStudentForChart === 'all' 
              ? homeworks 
              : homeworks.filter(h => h.studentId?._id === selectedStudentForChart);
              
            const pieData = [
              { name: 'Graded', value: studentHwForPie.filter(h => h.status === 'Graded').length, color: '#10B981' }, 
              { name: 'Needs Grading', value: studentHwForPie.filter(h => h.status === 'Submitted').length, color: '#F59E0B' }, 
              { name: 'Pending/Overdue', value: studentHwForPie.filter(h => h.status === 'Pending').length, color: '#EF4444' } 
            ].filter(d => d.value > 0);

            // 2. Topic Confidence Data
            const studentTopicsForPie = selectedStudentForChart === 'all'
              ? topics
              : topics.filter(t => (t.studentId?._id || t.studentId) === selectedStudentForChart);

            const confidenceData = [
              { name: 'High (Green)', value: studentTopicsForPie.filter(t => t.studentConfidence === 'Green').length, color: '#10B981' },
              { name: 'Medium (Amber)', value: studentTopicsForPie.filter(t => t.studentConfidence === 'Amber').length, color: '#F59E0B' },
              { name: 'Low (Red)', value: studentTopicsForPie.filter(t => t.studentConfidence === 'Red').length, color: '#EF4444' },
              { name: 'Unrated', value: studentTopicsForPie.filter(t => !t.studentConfidence).length, color: '#94A3B8' }
            ].filter(d => d.value > 0);

            // 3. Average Scores by Assignment
            const scoreData = Object.values(homeworks.reduce((acc, hw) => {
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
            })).slice(0, 15);

            // 4. Timeliness Breakdown (On-Time vs Late)
            const lateSubmissions = studentHwForPie.filter(h => h.submission?.submittedAt && new Date(h.submission.submittedAt) > new Date(h.dueDate)).length;
            const onTimeSubmissions = studentHwForPie.filter(h => h.submission?.submittedAt && new Date(h.submission.submittedAt) <= new Date(h.dueDate)).length;
            const timelinessData = [
              { name: 'On Time', value: onTimeSubmissions, color: '#0EA5E9' },
              { name: 'Late', value: lateSubmissions, color: '#F43F5E' }
            ].filter(d => d.value > 0);

            // 5. Student Performance Rankings
            const studentAverages = students.map(s => {
              const sHw = homeworks.filter(h => h.studentId?._id === s._id && h.status === 'Graded');
              let earned = 0, possible = 0;
              sHw.forEach(h => {
                if (h.grading?.score != null && h.grading?.totalScore) {
                  earned += h.grading.score; possible += h.grading.totalScore;
                }
              });
              return {
                name: s.registrationName || s.name,
                avg: possible > 0 ? ((earned / possible) * 100).toFixed(1) : null,
                completed: sHw.length
              };
            }).filter(s => s.avg !== null).sort((a, b) => b.avg - a.avg);

            const topPerformers = studentAverages.slice(0, 5);
            const needsSupport = studentAverages.filter(s => parseFloat(s.avg) < 60).slice(-5).reverse();

            // 6. Actionable Admin KPIs
            const needsGradingCount = homeworks.filter(h => h.status === 'Submitted').length;
            const overdueCount = homeworks.filter(h => h.status === 'Pending' && new Date(h.dueDate) < new Date()).length;
            const classAvg = (() => {
              let earned = 0, possible = 0;
              homeworks.filter(h => h.status === 'Graded').forEach(h => {
                if (h.grading?.score != null && h.grading?.totalScore) {
                  earned += h.grading.score; possible += h.grading.totalScore;
                }
              });
              return possible > 0 ? ((earned / possible) * 100).toFixed(1) : 0;
            })();
            const classesTakenCount = schemes.filter(s => s.classStatus === 'Class Taken').length;

            return (
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in relative">
                
                {/* Header & Export Button */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-sky-500 w-2 h-8 rounded-full"></div>
                    <h2 className="text-2xl font-black text-[#1B2559]">Class Analytics</h2>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <select 
                      className="w-full sm:w-auto p-3 bg-[#F4F7FE] border-none rounded-xl outline-none focus:ring-4 focus:ring-sky-500/20 font-bold text-[#1B2559] text-sm"
                      value={selectedStudentForChart}
                      onChange={e => setSelectedStudentForChart(e.target.value)}
                    >
                      <option value="all">Entire Class Filter</option>
                      {students.sort((a, b) => (a.registrationName || a.name || '').localeCompare(b.registrationName || b.name || '')).map(s => (
                        <option key={s._id} value={s._id}>
                          {s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}
                        </option>
                      ))}
                    </select>
                    <button onClick={handleExportAnalyticsPDF} className="w-full sm:w-auto px-5 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white font-black rounded-xl transition-colors shadow-sm flex justify-center items-center gap-2 border border-indigo-100">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      Export PDF Report
                    </button>
                  </div>
                </div>

                {/* PDF EXPORT */}
                <div id="analytics-export-area" className="space-y-8 bg-white p-2">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex flex-col justify-center">
                      <h3 className="text-amber-800 font-black text-sm uppercase tracking-wider">Needs Grading</h3>
                      <p className="text-4xl font-black text-amber-600 mt-2">{needsGradingCount}</p>
                    </div>
                    <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 flex flex-col justify-center">
                      <h3 className="text-rose-800 font-black text-sm uppercase tracking-wider">Overdue Tasks</h3>
                      <p className="text-4xl font-black text-rose-600 mt-2">{overdueCount}</p>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex flex-col justify-center">
                      <h3 className="text-emerald-800 font-black text-sm uppercase tracking-wider">Class Avg Score</h3>
                      <p className="text-4xl font-black text-emerald-600 mt-2">{classAvg}%</p>
                    </div>
                    <div className="bg-sky-50 p-6 rounded-3xl border border-sky-100 flex flex-col justify-center">
                      <h3 className="text-sky-800 font-black text-sm uppercase tracking-wider">Classes Logged</h3>
                      <p className="text-4xl font-black text-sky-600 mt-2">{classesTakenCount}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* PIE CHART: Task Status */}
                    <div className="bg-[#F4F7FE]/50 p-6 rounded-3xl border border-slate-100">
                      <div className="mb-4">
                        <h3 className="text-lg font-black text-[#1B2559]">Homework Completion</h3>
                      </div>
                      {pieData.length > 0 ? (
                        <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value"
                                label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}>
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 'bold' }} />
                              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontWeight: 'bold', fontSize: '10px' }}/>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex h-[200px] items-center justify-center opacity-50"><p className="font-bold text-[#1B2559]">No homework assigned.</p></div>
                      )}
                    </div>

                    {/* PIE CHART: Timeliness */}
                    <div className="bg-[#F4F7FE]/50 p-6 rounded-3xl border border-slate-100">
                      <div className="mb-4">
                        <h3 className="text-lg font-black text-[#1B2559]">Submission Timeliness</h3>
                      </div>
                      {timelinessData.length > 0 ? (
                        <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={timelinessData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value"
                                label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}>
                                {timelinessData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 'bold' }} />
                              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontWeight: 'bold', fontSize: '10px' }}/>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex h-[200px] items-center justify-center opacity-50"><p className="font-bold text-[#1B2559]">No submissions yet.</p></div>
                      )}
                    </div>

                    {/* PIE CHART: Topic Confidence */}
                    <div className="bg-[#F4F7FE]/50 p-6 rounded-3xl border border-slate-100">
                      <div className="mb-4">
                        <h3 className="text-lg font-black text-[#1B2559]">Topic Confidence</h3>
                      </div>
                      {confidenceData.length > 0 ? (
                        <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={confidenceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value"
                                label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}>
                                {confidenceData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: 'bold' }} />
                              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontWeight: 'bold', fontSize: '10px' }}/>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex h-[200px] items-center justify-center opacity-50"><p className="font-bold text-[#1B2559]">No confidence data.</p></div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* BAR CHART: Scores */}
                    <div className="bg-[#F4F7FE]/50 p-6 rounded-3xl border border-slate-100 lg:col-span-2">
                      <div className="mb-6">
                        <h3 className="text-xl font-black text-[#1B2559]">Average Scores per Homework</h3>
                      </div>
                      {scoreData.length > 0 ? (
                        <div className="h-[300px] w-full pt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scoreData} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontWeight: 600, fontSize: 12 }} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontWeight: 600, fontSize: 12 }} domain={[0, 100]} />
                              <Tooltip cursor={{ fill: '#F4F7FE' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold' }} />
                              <Bar dataKey="avgScore" name="Avg Score (%)" fill="#0EA5E9" radius={[6, 6, 0, 0]} barSize={30} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex h-[250px] items-center justify-center opacity-50"><p className="font-bold text-[#1B2559]">Not enough graded data yet.</p></div>
                      )}
                    </div>

                    {/* STUDENT RANKINGS */}
                    <div className="bg-white rounded-3xl border border-slate-100 flex flex-col shadow-sm">
                      <div className="p-5 border-b border-slate-100">
                        <h3 className="text-lg font-black text-[#1B2559]">Student Overview</h3>
                      </div>
                      
                      <div className="p-5 flex-1 space-y-6">
                        <div>
                          <h4 className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-3">Top Performers</h4>
                          <div className="space-y-3">
                            {topPerformers.length > 0 ? topPerformers.map((s, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="font-bold text-slate-700 truncate pr-2">{idx + 1}. {s.name}</span>
                                <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{s.avg}%</span>
                              </div>
                            )) : <p className="text-xs font-bold text-slate-400">No data available.</p>}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-rose-600 uppercase tracking-wider mb-3">Needs Support (&lt; 60%)</h4>
                          <div className="space-y-3">
                            {needsSupport.length > 0 ? needsSupport.map((s, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="font-bold text-slate-700 truncate pr-2">⚠️ {s.name}</span>
                                <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded">{s.avg}%</span>
                              </div>
                            )) : <p className="text-xs font-bold text-slate-400">No students currently in this range.</p>}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })()}

          {/* VIEW 5: MESSAGES TAB */}
          {activeTab === 'messages' && (
            <div 
              ref={chatContainerRef} 
              className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] h-[85vh] md:h-[800px] flex flex-col lg:flex-row overflow-hidden animate-fade-in relative"
              style={{ '--chat-sidebar-width': `${chatSidebarWidth}%` }}
            >
              
              {/* Left Side: Contact List */}
              <div className={`w-full lg:w-[var(--chat-sidebar-width)] border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 flex flex-col min-h-0 flex-1 lg:flex-none lg:shrink-0 lg:pr-4 transition-none ${selectedStudentForChat ? 'hidden lg:flex' : 'flex'}`}>
                <h2 className="text-xl font-black text-[#1B2559] mb-6 shrink-0">Conversations</h2>
                <div className="overflow-y-auto custom-scrollbar flex-1 space-y-2">
                  
                  {/* GLOBAL CHAT BUTTON */}
                  {user?.role === 'admin' && (
                    <button 
                      onClick={() => { setSelectedStudentForChat({ _id: 'all', name: 'Entire Class', registrationName: 'Entire Class', yearGroup: '' }); fetchMessages('all'); }}
                      className={`w-full text-left p-4 rounded-2xl font-bold transition-colors flex items-center gap-3 mb-4 border-2 ${selectedStudentForChat?._id === 'all' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                      <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-full flex items-center justify-center font-black text-xl shrink-0">🌍</div>
                      <div className="truncate">
                        <p className="flex items-center gap-2 text-[#1B2559]">Global Class Chat</p>
                        <p className="text-xs text-indigo-400 font-medium truncate">Message everyone</p>
                      </div>
                    </button>
                  )}

                  {/* GRADER VIEW: CHAT WITH ADMIN */}
                  {user?.role === 'grader' && (
                    <button 
                      onClick={() => { 
                        setSelectedStudentForChat({ _id: '', name: 'Main Admin', registrationName: 'Main Admin', role: 'admin' }); 
                        setChatTarget('admin'); 
                        fetchMessages('admin'); 
                      }}
                      className={`w-full text-left p-4 rounded-2xl font-bold transition-colors flex items-center gap-3 border-2 ${selectedStudentForChat?.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center font-black text-xl shrink-0">👨‍🏫</div>
                      <div className="truncate">
                        <p className="flex items-center gap-2 text-[#1B2559]">Main Admin</p>
                        <p className="text-xs text-indigo-400 font-medium truncate">Mentor / Manager</p>
                      </div>
                    </button>
                  )}

                  {/* ADMIN VIEW: GRADERS LIST */}
                  {user?.role === 'admin' && graders.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-black text-[#A3AED0] uppercase tracking-wide mb-2 pl-2">Graders</p>
                      {graders.map(grader => (
                        <button key={grader._id} 
                          onClick={() => { 
                            setSelectedStudentForChat(grader); 
                            setChatTarget('grader'); 
                            setSelectedParent(null);  
                            fetchMessages(grader._id); 
                          }}
                          className={`w-full text-left p-4 rounded-2xl font-bold transition-colors flex items-center gap-3 ${selectedStudentForChat?._id === grader._id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-black shrink-0">{(grader.name).charAt(0)}</div>
                          <div className="truncate">
                            <p className="flex items-center gap-2">
                              <span className="truncate">{grader.name}</span>
                              <span className="shrink-0 text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-md">Grader</span>
                            </p>
                            <p className="text-xs text-slate-400 font-medium truncate">{grader.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ADMIN VIEW: STUDENTS LIST */}
                  {user?.role === 'admin' && students.length > 0 && (
                    <div>
                      <p className="text-xs font-black text-[#A3AED0] uppercase tracking-wide mb-2 pl-2 mt-4">Students</p>
                      {students.map(student => (
                        <button key={student._id} 
                          onClick={() => { 
                            setSelectedStudentForChat(student); 
                            setChatTarget('student'); 
                            setSelectedParent(null);  
                            fetchMessages(student._id); 
                        }}
                      className={`w-full text-left p-4 rounded-2xl font-bold transition-colors flex items-center gap-3 ${selectedStudentForChat?._id === student._id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
  
                      {student.profilePic ? (
                        <img src={student.profilePic} alt={student.name} className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0 border border-indigo-100" />
                        ) : (
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center font-black shrink-0">
                        {(student.registrationName || student.name).charAt(0)}
                      </div>
                       )}
                          <div className="truncate w-full">
                            <p className="flex items-center gap-2">
                              <span className="truncate">{student.registrationName || student.name}</span>
                              {student.yearGroup && <span className="shrink-0 text-[10px] bg-indigo-200/50 text-indigo-700 px-1.5 py-0.5 rounded-md">{student.yearGroup}</span>}
                            </p>
                            <div className="flex items-center justify-between mt-0.5 w-full pr-2">
                              <p className="text-xs text-slate-400 font-medium truncate">{student.email}</p>
                              {parentStatuses[student._id] === true && (
                                <span className="shrink-0 text-[9px] font-black bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded shadow-sm ml-2">👨‍👩‍👦 Linked</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div 
                className="hidden lg:flex w-4 cursor-col-resize items-center justify-center transition-colors z-20 shrink-0 hover:bg-indigo-50/50 -ml-2"
                onMouseDown={() => setIsChatDragging(true)}
              >
                 <div className={`w-1 h-16 rounded-full transition-colors ${isChatDragging ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
              </div>

              {/* Right Side: Chat Window */}
              <div className={`w-full lg:flex-1 flex flex-col bg-[#F4F7FE]/50 rounded-3xl overflow-hidden relative min-h-0 mt-4 lg:mt-0 lg:ml-2 transition-none ${selectedStudentForChat ? 'flex' : 'hidden lg:flex'}`}>
                {selectedStudentForChat ? (
                  <>
                    <div className="bg-white p-4 border-b border-slate-100 font-black text-[#1B2559] flex items-center justify-between shadow-sm z-10">
                      <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                        
                        {/* Mobile Back Button */}
                        <button onClick={() => setSelectedStudentForChat(null)} className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-indigo-600 outline-none shrink-0">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>

                        {/* Parent vs Student Profile Check */}
                        {chatTarget === 'parent' && selectedParent ? (
                          <>
                            {selectedParent.profilePic ? (
                              <img src={selectedParent.profilePic} alt={selectedParent.name} className="w-8 h-8 rounded-full object-cover shadow-sm border border-violet-200 shrink-0" />
                            ) : (
                              <div className="w-8 h-8 bg-violet-500 text-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                                {(selectedParent.registrationName || selectedParent.name).charAt(0)}
                              </div>
                            )}
                            <span className="truncate max-w-[180px] sm:max-w-xs">Parent: {selectedParent.registrationName || selectedParent.name}</span>
                          </>
                        ) : (
                          <>
                            {selectedStudentForChat._id === 'all' ? (
                              <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm shadow-sm shrink-0">🌍</div>
                            ) : selectedStudentForChat.profilePic ? (
                              <img src={selectedStudentForChat.profilePic} alt={selectedStudentForChat.name} className="w-8 h-8 rounded-full object-cover shadow-sm border border-indigo-100 shrink-0" />
                            ) : (
                              <div className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                                {(selectedStudentForChat.registrationName || selectedStudentForChat.name).charAt(0)}
                              </div>
                            )}
                            <span className="truncate max-w-[180px] sm:max-w-xs">{selectedStudentForChat.registrationName || selectedStudentForChat.name} {selectedStudentForChat.yearGroup ? `(${selectedStudentForChat.yearGroup})` : ''}</span>
                          </>
                        )}
                        
                      </div>
                      <span className="hidden sm:flex text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 shadow-sm items-center gap-1.5 shrink-0 ml-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Chats delete within 24hrs
                      </span>
                    </div>

                    {selectedStudentForChat._id !== 'all' && chatTarget !== 'grader' && chatTarget !== 'admin' && (
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
                          disabled={parentStatuses[selectedStudentForChat._id] === false}
                          onClick={async () => {
                          try {
                            const res = await api.get(`/admin/student/${selectedStudentForChat._id}/parent`);
                            setSelectedParent(res.data);
                            setChatTarget('parent');
                            fetchMessages(res.data._id); 
                            } catch (err) {
                            showToast("No parent account is linked to this student yet.", "error");
                         }
                        }} 
                          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                          parentStatuses[selectedStudentForChat._id] === false 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : chatTarget === 'parent' 
                          ? 'bg-violet-500 text-white shadow-md' 
                          : 'text-slate-500 hover:bg-slate-50'
                        }`}>
                        {parentStatuses[selectedStudentForChat._id] === false ? '🚫 No Parent Linked' : '👨‍👩‍👦 Chat with Parent'}
                        </button>
                        </div>
                        
                        {chatTarget === 'parent' && selectedParent && (
                          <div className="text-xs font-bold text-violet-700 bg-violet-100 px-3 py-1.5 rounded-lg border border-violet-200 shadow-sm">
                            Messaging Parent: {selectedParent.registrationName || selectedParent.name}
                          </div>
                        )}
                      </div>
                    )}
                    {/* END OF PARENT TOGGLE UI */}
                    
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

                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-3 w-full">
  <input type="text" className="w-full flex-1 p-4 bg-[#F4F7FE] border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-[#1B2559]" 
    placeholder="Type your message..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
  <button className="w-full sm:w-auto px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-md">Send</button>
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

          {/* VIEW 6: STUDY LIBRARY */}
          {activeTab === 'library' && (
            <div className="animate-fade-in relative">
              
              {isAssignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                  <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl transform scale-100 animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                      <div className="bg-cyan-500 w-2 h-8 rounded-full"></div>
                      <h2 className="text-2xl font-black text-[#1B2559]">Add Study Material</h2>
                    </div>
                    
                    <form onSubmit={async (e) => {
                      await handleResourceSubmit(e);
                      setIsAssignModalOpen(false);
                    }} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Title</label>
                        <input type="text" required className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-cyan-500/20 font-bold text-[#1B2559]" 
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
                          <input type="file" accept=".pdf, image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleResourceFile} />
                            <p className="font-bold text-slate-600 text-sm">{resourceForm.url ? '✅ File Attached' : 'Click to upload PDF/Image'}</p>
                            {isResourceUploading && <p className="text-xs text-amber-500 mt-1">Uploading...</p>}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Paste URL</label>
                          <input type="url" required className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-cyan-500/20 font-bold text-[#1B2559]" 
                            placeholder="https://..." value={resourceForm.url} onChange={e => setResourceForm({...resourceForm, url: e.target.value})} />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Short Description (Optional)</label>
                        <textarea className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-cyan-500/20 font-bold text-[#1B2559]" 
                          placeholder="What is this material about?" value={resourceForm.description} onChange={e => setResourceForm({...resourceForm, description: e.target.value})} />
                      </div>

                      <div className="space-y-2 pt-4 border-t border-slate-100">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Filter by Year Group</label>
                        <select className="w-full max-w-full truncate p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]"
                          value={resourceForm.yearGroupFilter} onChange={e => {
                            const selectedYear = e.target.value;
                            setResourceForm({
                              ...resourceForm, 
                              yearGroupFilter: selectedYear, 
                              targetAudience: ''
                            });
                          }}>
                          <option value="all">All Years</option>
                          {[...new Set(students.map(s => s.yearGroup).filter(Boolean))].map(yg => (
                            <option key={yg} value={yg}>{yg}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Select Student</label>
                        <select className="w-full max-w-full truncate p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]" 
                          value={resourceForm.targetAudience} onChange={e => setResourceForm({...resourceForm, targetAudience: e.target.value})}>
                          <option value="">-- Choose a Student --</option>
                          {students.filter(s => resourceForm.yearGroupFilter === 'all' || s.yearGroup === resourceForm.yearGroupFilter)
                            .sort((a, b) => (a.registrationName || a.name || '').localeCompare(b.registrationName || b.name || ''))
                            .map(s => (
                            <option key={s._id} value={s._id}>👤 {s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button type="button" onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-colors">
                          Cancel
                        </button>
                        <button disabled={isResourceUploading} type="submit" className="flex-1 bg-[#1B2559] hover:bg-cyan-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg transform hover:-translate-y-1 disabled:opacity-50">
                          Publish Material
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* STUDY MATERIALS BOARD */}
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-500 w-2 h-8 rounded-full"></div>
                    <h2 className="text-2xl font-black text-[#1B2559]">Study Materials Hub</h2>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-wrap justify-end">
                    <div className="relative">
                      <svg className="w-5 h-5 absolute left-4 top-3 text-[#A3AED0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      <input type="text" placeholder="Search materials..." 
                        className="w-full sm:w-64 p-3 pl-12 bg-[#F4F7FE] border-none rounded-xl outline-none focus:ring-4 focus:ring-cyan-500/10 font-bold text-[#1B2559]"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    <button onClick={() => {
                      setResourceForm({ title: '', description: '', type: 'Document', url: '', targetAudience: '', yearGroupFilter: 'all' });
                      setIsAssignModalOpen(true);
                    }} className="px-6 py-3 font-black rounded-xl shadow-lg transition-transform flex items-center justify-center gap-2 whitespace-nowrap bg-cyan-500 hover:bg-cyan-600 text-white hover:-translate-y-1">
                      <span>+</span> Add Material
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 sm:items-end">
                  <div className="flex-1 min-w-[110px]">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Filter by Year</label>
                    <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm"
                      value={hwYearFilter} onChange={e => { setHwYearFilter(e.target.value); setHwStudentFilter('all'); }}>
                      <option value="all">All Years</option>
                      {[...new Set(students.map(s => s.yearGroup).filter(Boolean))].map(yg => (
                        <option key={yg} value={yg}>{yg}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-[1.5] min-w-[150px]">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Filter by Student</label>
                    <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm"
                      value={hwStudentFilter} onChange={e => setHwStudentFilter(e.target.value)}>
                      <option value="all">All Filtered Students</option>
                      {students
                        .filter(s => hwYearFilter === 'all' || s.yearGroup === hwYearFilter)
                        .sort((a, b) => (a.registrationName || a.name || '').localeCompare(b.registrationName || b.name || ''))
                        .map(s => (
                        <option key={s._id} value={s._id}>{s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto w-full max-w-full pb-4 relative flex-1 custom-scrollbar">
                  <table className="w-full min-w-[1000px] text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-cyan-500 text-white text-xs font-black uppercase tracking-wider sticky top-0 z-10 align-top shadow-sm">
                        <th className="p-4 rounded-tl-2xl">Material Details</th>
                        <th className="p-4">Assigned To</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Date Added</th>
                        <th className="p-4 rounded-tr-2xl text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resources
                        .filter(res => {
                          const searchLower = (searchTerm || '').toLowerCase();
                          const matchesSearch = res.title?.toLowerCase().includes(searchLower) || 
                                              (res.targetAudience !== 'all' && students.find(s => s._id === res.targetAudience)?.name.toLowerCase().includes(searchLower));
                          
                          if (!matchesSearch) return false;
                          
                          if (hwStudentFilter !== 'all') {
                            if (res.targetAudience !== 'all' && String(res.targetAudience) !== String(hwStudentFilter)) return false;
                          } else if (hwYearFilter !== 'all') {
                            if (res.targetAudience !== 'all') {
                              const targetStudent = students.find(s => s._id === res.targetAudience);
                              if (!targetStudent || targetStudent.yearGroup !== hwYearFilter) return false;
                            }
                          }
                          return true;
                        })
                        .map((res, index) => {
                        return (
                          <tr key={res._id} className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-cyan-50/20'}`}>
                            <td className="p-4 whitespace-normal min-w-[300px] leading-snug">
                              <h3 className="font-black text-[#1B2559] text-lg">{res.title}</h3>
                              <p className="font-bold text-slate-500 text-sm mt-1">{res.description || '-'}</p>
                            </td>
                            <td className="p-4 font-black text-[#1B2559]">
                              {res.targetAudience === 'all' 
                                ? (
                                  <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider bg-indigo-100 text-indigo-700 inline-block">
                                    📢 Everyone
                                  </span>
                                )
                                : (() => {
                                    const st = students.find(s => s._id === res.targetAudience);
                                    return st ? (
                                      <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider bg-amber-100 text-amber-700 inline-block">
                                        👤 {st.registrationName || st.name} {st.yearGroup ? `(${st.yearGroup})` : ''}
                                      </span>
                                    ) : 'Specific Student';
                                  })()
                              }
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider
                                ${res.type === 'Document' ? 'bg-rose-100 text-rose-700' : res.type === 'Video Link' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'}`}>
                                {res.type}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="text-xs font-bold text-slate-500">{new Date(res.createdAt).toLocaleDateString()}</span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex flex-row flex-nowrap items-center justify-center gap-2 w-max mx-auto">
                                <button onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = res.url;
                                    a.target = "_blank";
                                    if (res.type === 'Document') a.download = `${res.title.replace(/\s+/g, '_')}`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                  }} 
                                  className="px-4 py-2 bg-[#1B2559] text-white font-black rounded-lg hover:bg-cyan-600 transition-colors shadow-sm text-xs">
                                  {res.type === 'Document' ? '⬇️ Download' : '🔗 Open Link'}
                                </button>
                                <button onClick={() => handleDeleteResource(res._id)} className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors shadow-sm" title="Delete">
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      
                      {resources.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center py-20">
                            <div className="flex flex-col items-center justify-center">
                              <div className="text-6xl mb-4 opacity-50">🗂️</div>
                              <p className="text-[#1B2559] font-black text-xl mb-1">Library is empty!</p>
                              <p className="text-[#A3AED0] font-bold">Add study materials using the button above.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* NEW GRADER MANAGEMENT TAB */}
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
                      <button onClick={() => {
  setModal({ type: 'deleteGrader', graderId: grader._id, data: grader.name });
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

          {/* SUBMITTED WORK TAB (ADMIN & GRADER) */}
          {activeTab === 'submitted' && (
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-100 pb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500 w-2 h-8 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[#1B2559]">Submitted Student Work</h2>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-wrap justify-end">
                  <div className="relative">
                    <svg className="w-5 h-5 absolute left-4 top-3 text-[#A3AED0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input type="text" placeholder="Search tasks..." 
                      className="w-full sm:w-72 p-3 pl-12 bg-[#F4F7FE] border-none rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/10 font-bold text-[#1B2559]"
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 sm:items-end">
                <div className="flex-1 min-w-[110px]">
                  <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Filter by Year</label>
                  <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm"
                    value={hwYearFilter} onChange={e => { setHwYearFilter(e.target.value); setHwStudentFilter('all'); }}>
                    <option value="all">All Years</option>
                    {[...new Set(students.map(s => s.yearGroup).filter(Boolean))].map(yg => (
                      <option key={yg} value={yg}>{yg}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-[1.5] min-w-[150px]">
                  <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Filter by Student</label>
                  <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm"
                    value={hwStudentFilter} onChange={e => setHwStudentFilter(e.target.value)}>
                    <option value="all">All Filtered Students</option>
                    {students
                      .filter(s => hwYearFilter === 'all' || s.yearGroup === hwYearFilter)
                      .sort((a, b) => (a.registrationName || a.name || '').localeCompare(b.registrationName || b.name || ''))
                      .map(s => (
                      <option key={s._id} value={s._id}>{s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1 min-w-[110px]">
                  <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Filter by Status</label>
                  <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm"
                    value={hwStatusFilter} onChange={e => setHwStatusFilter(e.target.value)}>
                    <option value="all">All Submissions</option>
                    <option value="Submitted">Submitted (Review)</option>
                    <option value="Graded">Graded</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto w-full max-w-full pb-4 relative max-h-[600px] custom-scrollbar">
                <table className="w-full min-w-[1000px] text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-emerald-600 text-white text-xs font-black uppercase tracking-wider sticky top-0 z-10 align-top shadow-sm">
                      <th className="p-4 rounded-tl-2xl cursor-pointer hover:bg-emerald-700 transition-colors" onClick={() => handleSortHomework('title')}>
                        Task Details {hwSortConfig.key === 'title' ? (hwSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="p-4 cursor-pointer hover:bg-emerald-700 transition-colors" onClick={() => handleSortHomework('student')}>
                        Assigned To {hwSortConfig.key === 'student' ? (hwSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="p-4 cursor-pointer hover:bg-emerald-700 transition-colors" onClick={() => handleSortHomework('submissionTime')}>
                        Time Submitted {hwSortConfig.key === 'submissionTime' ? (hwSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="p-4 cursor-pointer hover:bg-emerald-700 transition-colors" onClick={() => handleSortHomework('dueDate')}>
                        Dates {hwSortConfig.key === 'dueDate' ? (hwSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="p-4 cursor-pointer hover:bg-emerald-700 transition-colors" onClick={() => handleSortHomework('status')}>
                        Status {hwSortConfig.key === 'status' ? (hwSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="p-4 rounded-tr-2xl text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHomeworks.filter(hw => hw.status === 'Submitted' || hw.status === 'Graded').map((hw, index) => {
                      const isLate = new Date() > new Date(hw.dueDate);
                      
                      return (
                        <tr key={hw._id} className={`border-b border-slate-200 hover:bg-slate-200 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'}`}>
                          <td className="p-4 whitespace-normal min-w-[200px] leading-snug">
                            <h3 className="font-black text-[#1B2559]">{formatTaskTitle(hw.title)}</h3>
                            <p className="text-xs font-bold text-slate-500 mt-1">Format: {hw.type}</p>
                          </td>
                          <td className="p-4 font-black text-[#1B2559]">
                            {hw.studentId ? `${capitalizeName(hw.studentId.registrationName || hw.studentId.name)} ${hw.studentId.yearGroup ? `(${hw.studentId.yearGroup})` : ''}` : "Deleted User"}
                            {hw.grading?.gradedBy && user?.role === 'admin' && (() => {
                              const graderId = String(hw.grading.gradedBy?._id || hw.grading.gradedBy);
                              const matchedGrader = graders.find(g => String(g._id) === graderId);
                              if (matchedGrader) {
                                return (
                                  <p className="text-[10px] text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 mt-1 rounded-md font-black w-max">
                                    ✅ Marked by {matchedGrader.name}
                                  </p>
                                );
                              }
                              return null;
                            })()}
                          </td>
                          <td className="p-4 font-bold text-[#1B2559]">
                            {hw.submission?.submittedAt ? new Date(hw.submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1 text-xs font-black">
                              <span className="text-slate-500">Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                              {hw.submission?.submittedAt && (
                                <span className="text-indigo-600">Sub: {new Date(hw.submission.submittedAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col items-start gap-1.5">
                              <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider
                                ${hw.status === 'Pending' ? 'bg-slate-100 text-slate-500' : 
                                  hw.status === 'Submitted' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                                {hw.status}
                              </span>
                              {hw.submission?.submittedAt && new Date(hw.submission.submittedAt) > new Date(hw.dueDate) && (
                                <span className="bg-rose-500 text-white px-2 py-1 rounded-md text-[10px] font-black shadow-sm">
                                  LATE SUBMISSION
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                             <div className="flex flex-row flex-nowrap items-center justify-center gap-2 w-max mx-auto">
                                {hw.status === 'Submitted' && (
                                  <>
                                    <button onClick={() => setModal({ type: 'viewOriginalWork', data: hw })} className="px-3 py-1.5 bg-sky-50 border border-sky-200 text-sky-600 font-black rounded-lg hover:bg-sky-100 transition-colors shadow-sm text-xs whitespace-nowrap">
                                      View Assigned Work
                                    </button>
                                    {hw.submission && (hw.submission.answerFileUrl || hw.submission.answerText || (hw.submission.attachments && hw.submission.attachments.length > 0)) && (
                                      <button onClick={() => setModal({ type: 'viewWork', hwId: hw._id, data: hw.submission, title: hw.title, student: hw.studentId })} className="px-3 py-1.5 bg-[#1B2559] text-white font-black rounded-lg hover:bg-indigo-900 transition-colors shadow-sm text-xs whitespace-nowrap">
                                        View SW
                                      </button>
                                    )}
                                    <button onClick={() => setModal({ type: 'grade', hwId: hw._id, data: { score: '', totalScore: '', driveLink: hw.driveLink || '', feedback: '' } })} className="px-3 py-1.5 bg-emerald-500 text-white font-black rounded-lg hover:bg-emerald-600 transition-transform hover:-translate-y-1 shadow-sm text-xs flex items-center gap-1 whitespace-nowrap">
                                      Grade
                                    </button>
                                  </>
                                )}
                                
                                {hw.status === 'Graded' && (
                                  <div className="flex items-center gap-2">
                                    {user?.role === 'admin' ? (
                                      <button 
                                        onClick={() => {
                                          setModal({ type: 'grade', hwId: hw._id, data: { score: hw.grading?.score ?? '', totalScore: hw.grading?.totalScore ?? '', driveLink: hw.driveLink || '', feedback: hw.grading?.feedback || '', adminAnswerSheetUrl: hw.grading?.adminAnswerSheetUrl || '' } });
                                          if (hw.grading?.adminAnswerSheetUrl || (hw.grading?.adminAttachments && hw.grading.adminAttachments.length > 0)) {
                                            setAnswerSheet({ 
                                                fileUrl: hw.grading.adminAnswerSheetUrl || '', 
                                                fileName: 'Existing Marked/Checked work Attached', 
                                                attachments: hw.grading.adminAttachments || [], 
                                                isUploading: false 
                                            });
                                          } else {
                                            setAnswerSheet({ fileUrl: '', fileName: '', attachments: [], isUploading: false });
                                          }
                                        }}
                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-black border border-emerald-200 text-xs transition-colors shadow-sm"
                                      >
                                        {hw.grading?.score != null ? `${hw.grading.score}/${hw.grading.totalScore} ✏️` : 'Edit'}
                                      </button>
                                    ) : (
                                      <div className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg font-black border border-slate-200 text-xs shadow-sm cursor-not-allowed">
                                        {hw.grading?.score != null ? `${hw.grading.score}/${hw.grading.totalScore} 🔒` : 'Marked 🔒'}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {user?.role === 'admin' && (
                                  <button onClick={() => setModal({ type: 'delete', hwId: hw._id, data: '' })} className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors shadow-sm" title="Delete">
                                    🗑️
                                  </button>
                                )}
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                    
                    {filteredHomeworks.filter(hw => hw.status === 'Submitted' || hw.status === 'Graded').length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-20">
                          <div className="flex flex-col items-center justify-center">
                            <div className="text-6xl mb-4 opacity-50">📭</div>
                            <p className="text-[#1B2559] font-black text-xl mb-1">No submissions yet!</p>
                            <p className="text-[#A3AED0] font-bold">When students submit work, it will appear here for grading.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SHARED DRIVE */}
          {activeTab === 'drive' && (
            <div className="animate-fade-in relative">
              
              {isAssignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                  <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl transform scale-100 animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                      <div className="bg-blue-500 w-2 h-8 rounded-full"></div>
                      <h2 className="text-2xl font-black text-[#1B2559]">Share Drive Link</h2>
                    </div>
                    
                    <form onSubmit={async (e) => {
                      await handleDriveSubmit(e);
                      setIsAssignModalOpen(false);
                    }} className="space-y-6">
                      
                      <div className="space-y-2">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Title / Description</label>
                        <input type="text" required className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/20 font-bold text-[#1B2559]" 
                          placeholder="e.g. Graded Midterms Folder" value={driveForm.title} onChange={e => setDriveForm({...driveForm, title: e.target.value})} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Google Drive Link</label>
                        <input type="url" required className="w-full p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/20 font-bold text-[#1B2559]" 
                          placeholder="https://drive.google.com/..." value={driveForm.url} onChange={e => setDriveForm({...driveForm, url: e.target.value})} />
                      </div>

                      <div className="space-y-2 pt-4 border-t border-slate-100">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Filter by Year Group</label>
                        <select className="w-full max-w-full truncate p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]"
                          value={driveForm.yearGroupFilter} onChange={e => {
                            const selectedYear = e.target.value;
                            setDriveForm({
                              ...driveForm, 
                              yearGroupFilter: selectedYear, 
                              targetAudience: ''
                            });
                          }}>
                          <option value="all">All Years</option>
                          {[...new Set(students.map(s => s.yearGroup).filter(Boolean))].map(yg => (
                            <option key={yg} value={yg}>{yg}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Select Student</label>
                        <select className="w-full max-w-full truncate p-4 bg-[#F4F7FE] border-none rounded-2xl outline-none font-bold text-[#1B2559]" 
                          value={driveForm.targetAudience} onChange={e => setDriveForm({...driveForm, targetAudience: e.target.value})}>
                          
                          <option value="">-- Choose a Student --</option>
                          
                          {students.filter(s => driveForm.yearGroupFilter === 'all' || s.yearGroup === driveForm.yearGroupFilter)
                            .sort((a, b) => (a.registrationName || a.name || '').localeCompare(b.registrationName || b.name || ''))
                            .map(s => (
                            <option key={s._id} value={s._id}>👤 {s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button type="button" onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-colors">
                          Cancel
                        </button>
                        <button type="submit" className="flex-1 bg-[#1B2559] hover:bg-blue-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg transform hover:-translate-y-1">
                          Post Link
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* SHARED DRIVE BOARD */}
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-100 pb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 w-2 h-8 rounded-full"></div>
                    <h2 className="text-2xl font-black text-[#1B2559]">Shared Drive Links</h2>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-wrap justify-end">
                    <div className="relative">
                      <svg className="w-5 h-5 absolute left-4 top-3 text-[#A3AED0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      <input type="text" placeholder="Search links..." 
                        className="w-full sm:w-64 p-3 pl-12 bg-[#F4F7FE] border-none rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-[#1B2559]"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    <button onClick={() => {
                      setDriveForm({ title: '', url: '', targetAudience: '', yearGroupFilter: 'all' });
                      setIsAssignModalOpen(true);
                    }} className="px-6 py-3 font-black rounded-xl shadow-lg transition-transform flex items-center justify-center gap-2 whitespace-nowrap bg-blue-500 hover:bg-blue-600 text-white hover:-translate-y-1">
                      <span>+</span> Add Drive Link
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 sm:items-end">
                  <div className="flex-1 min-w-[110px]">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Filter by Year</label>
                    <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm"
                      value={hwYearFilter} onChange={e => { setHwYearFilter(e.target.value); setHwStudentFilter('all'); }}>
                      <option value="all">All Years</option>
                      {[...new Set(students.map(s => s.yearGroup).filter(Boolean))].map(yg => (
                        <option key={yg} value={yg}>{yg}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-[1.5] min-w-[150px]">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Filter by Student</label>
                    <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm"
                      value={hwStudentFilter} onChange={e => setHwStudentFilter(e.target.value)}>
                      <option value="all">All Filtered Students</option>
                      {students
                        .filter(s => hwYearFilter === 'all' || s.yearGroup === hwYearFilter)
                        .sort((a, b) => (a.registrationName || a.name || '').localeCompare(b.registrationName || b.name || ''))
                        .map(s => (
                        <option key={s._id} value={s._id}>{s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto w-full max-w-full pb-4 relative flex-1 custom-scrollbar">
                  <table className="w-full min-w-[800px] text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-blue-500 text-white text-xs font-black uppercase tracking-wider sticky top-0 z-10 align-top shadow-sm">
                        <th className="p-4 rounded-tl-2xl">Title & Description</th>
                        <th className="p-4">Assigned To</th>
                        <th className="p-4">Type</th>
                        <th className="p-4 rounded-tr-2xl text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {driveLinks
                        .filter(link => {
                          const searchLower = (searchTerm || '').toLowerCase();
                          const matchesSearch = link.title?.toLowerCase().includes(searchLower) || 
                                              (link.targetAudience !== 'all' && students.find(s => s._id === link.targetAudience)?.name.toLowerCase().includes(searchLower));
                          
                          if (!matchesSearch) return false;
                          
                          if (hwStudentFilter !== 'all') {
                            if (link.targetAudience !== 'all' && String(link.targetAudience) !== String(hwStudentFilter)) return false;
                          } else if (hwYearFilter !== 'all') {
                            if (link.targetAudience !== 'all') {
                              const targetStudent = students.find(s => s._id === link.targetAudience);
                              if (!targetStudent || targetStudent.yearGroup !== hwYearFilter) return false;
                            }
                          }
                          return true;
                        })
                        .map((link, index) => {
                        return (
                          <tr key={link._id} className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-blue-50/20'}`}>
                            <td className="p-4 whitespace-normal min-w-[200px] leading-snug">
                              <h3 className="font-black text-[#1B2559] text-lg">{link.title}</h3>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-blue-100 text-blue-700 mt-1 inline-block">
                                ☁️ Google Drive
                              </span>
                            </td>
                            <td className="p-4 font-black text-[#1B2559]">
                              {link.targetAudience === 'all' 
                                ? "All Students" 
                                : (() => {
                                    const st = students.find(s => s._id === link.targetAudience);
                                    return st ? `${st.registrationName || st.name} ${st.yearGroup ? `(${st.yearGroup})` : ''}` : 'Specific Student';
                                  })()
                              }
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider bg-indigo-100 text-indigo-700`}>
                                {link.targetAudience === 'all' ? 'Public' : 'Private'}
                              </span>
                            </td>
                            <td className="p-4">
                               <div className="flex flex-row flex-nowrap items-center justify-center gap-2 w-max mx-auto">
                                  <button onClick={() => window.open(link.url, "_blank")} className="px-4 py-2 bg-[#1B2559] text-white font-black rounded-lg hover:bg-indigo-900 transition-colors shadow-sm text-xs">
                                    🔗 Open Link
                                  </button>
                                  {user?.role === 'admin' && (
                                    <button onClick={() => handleDeleteDriveLink(link._id)} className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors shadow-sm" title="Delete">
                                      🗑️
                                    </button>
                                  )}
                               </div>
                            </td>
                          </tr>
                        );
                      })}
                      
                      {driveLinks.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center py-20">
                            <div className="flex flex-col items-center justify-center">
                              <div className="text-6xl mb-4 opacity-50">☁️</div>
                              <p className="text-[#1B2559] font-black text-xl mb-1">No Drive Links Found!</p>
                              <p className="text-[#A3AED0] font-bold">Share a new folder or file link using the form.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {/* VIEW: CLASS PLANNER */}
          {activeTab === 'planner' && (() => {
            const year = plannerCurrentDate.getFullYear();
            const month = plannerCurrentDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const emptyDays = (firstDayOfMonth + 6) % 7;
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            const getSessionsForDay = (day, m = month, y = year) => {
              return plannerSessions.filter(session => {
                const d = new Date(session.startDate);
                return d.getDate() === day && d.getMonth() === m && d.getFullYear() === y;
              });
            };

            const getSessionStatus = (session) => {
              const sessionDateStr = new Date(session.startDate).toDateString();
              const hasReport = schemes.some(report => 
                new Date(report.date).toDateString() === sessionDateStr && 
                report.studentId === session.studentId
              );
              
              if (hasReport) return 'logged';
              if (new Date(session.endDate) < new Date()) return 'missed';
              return 'upcoming';
            };

            const generateList = () => {
              if (plannerFilter === 'day') {
                const today = new Date().toLocaleDateString();
                return plannerSessions.filter(s => new Date(s.startDate).toLocaleDateString() === today);
              }
              if (plannerFilter === 'week') {
                const now = new Date();
                const first = now.getDate() - now.getDay();
                const firstDay = new Date(new Date().setDate(first));
                const lastDay = new Date(new Date().setDate(first + 6));
                return plannerSessions.filter(s => {
                  const d = new Date(s.startDate);
                  return d >= firstDay && d <= lastDay;
                });
              }
              if (plannerFilter === 'month') {
                return plannerSessions.filter(s => new Date(s.startDate).getMonth() === month && new Date(s.startDate).getFullYear() === year);
              }
              return [];
            };

            return (
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px] animate-fade-in relative">
                
                {/* Planner Form Modal */}
                {plannerModal.show && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
                      <h3 className="text-xl sm:text-2xl font-black text-[#1B2559] mb-4 shrink-0">
                        {plannerModal.data 
                          ? `Edit Class: ${plannerModal.data.studentId && plannerModal.data.studentId !== 'all' ? (students.find(s => s._id === plannerModal.data.studentId)?.registrationName || students.find(s => s._id === plannerModal.data.studentId)?.name || 'Unknown') : 'All Students'}` 
                          : `Schedule Class for ${plannerModal.selectedDate}`}
                      </h3>
                      
                      <form onSubmit={handlePlannerSubmit} className="space-y-3 sm:space-y-4 shrink-0">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Start Time</label>
                            <input type="time" required className="w-full p-3 sm:p-4 bg-[#F4F7FE] border-none rounded-xl font-bold outline-none text-[#1B2559]" 
                              value={plannerForm.startTime} 
                              onChange={e => {
                                const newStart = e.target.value;
                                setPlannerForm({
                                  ...plannerForm, 
                                  startTime: newStart, 
                                  endTime: calculateEndTime(newStart)
                                });
                              }} />
                          </div>
                          <div>
                            <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">End Time</label>
                            <input type="time" required className="w-full p-3 sm:p-4 bg-[#F4F7FE] border-none rounded-xl font-bold outline-none text-[#1B2559]" 
                              value={plannerForm.endTime} onChange={e => setPlannerForm({...plannerForm, endTime: e.target.value})} />
                          </div>
                        </div>

                        {plannerForm.startTime && plannerForm.endTime && (
                          <div className="text-sm font-black text-indigo-600 bg-indigo-50 px-4 py-2 sm:py-3 rounded-xl border border-indigo-100 flex justify-center items-center mt-3 sm:mt-4 shadow-sm">
                            ⏱️ Total Duration: {(() => {
                              const [sh, sm] = plannerForm.startTime.split(':').map(Number);
                              const [eh, em] = plannerForm.endTime.split(':').map(Number);
                              let diff = (eh * 60 + em) - (sh * 60 + sm);
                              if (diff < 0) diff += 24 * 60; 
                              const h = Math.floor(diff / 60);
                              const m = diff % 60;
                              return `${h > 0 ? h + ' hr ' : ''}${m > 0 ? m + ' min' : ''}`.trim();
                            })()}
                          </div>
                        )}
                        
                        {!plannerModal.data && (
                          <>
                            {/* 1. Year Group Filter Dropdown */}
                            <div className="space-y-1 sm:space-y-2 mt-3 sm:mt-4">
                                <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Filter by Year Group</label>
                                <select className="w-full p-3 sm:p-4 bg-[#F4F7FE] border-none rounded-xl outline-none font-bold text-[#1B2559]"
                                  value={plannerForm.yearGroupFilter}
                                  onChange={e => {
                                      const selectedYear = e.target.value;
                                      setPlannerForm({
                                          ...plannerForm,
                                          yearGroupFilter: selectedYear,
                                          studentId: ''
                                      });
                                  }}>
                                  <option value="all">All Years</option>
                                  {[...new Set(students.map(s => s.yearGroup).filter(Boolean))].map(yg => (
                                      <option key={yg} value={yg}>{yg}</option>
                                  ))}
                                </select>
                            </div>

                            {/* 2. Specific Student Dropdown */}
                            <div className="space-y-1 sm:space-y-2 mt-3 sm:mt-4">
                                <label className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Select Student</label>
                                <select className="w-full p-3 sm:p-4 bg-[#F4F7FE] border-none rounded-xl outline-none font-bold text-[#1B2559]"
                                  value={plannerForm.studentId}
                                  onChange={e => setPlannerForm({...plannerForm, studentId: e.target.value})}>
                                  
                                  <option value="">-- Choose a Student --</option>
                                  
                                  {students.filter(s => plannerForm.yearGroupFilter === 'all' || s.yearGroup === plannerForm.yearGroupFilter)
                                    .sort((a, b) => (a.registrationName || a.name || '').localeCompare(b.registrationName || b.name || ''))
                                    .map(s => (
                                      <option key={s._id} value={s._id}>👤 {s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}</option>
                                  ))}
                                </select>
                            </div>

                            {/* 3. Original Recurring Checkbox */}
                            <label className="flex items-center gap-3 cursor-pointer p-3 sm:p-4 bg-indigo-50 rounded-xl mt-3 sm:mt-4">
                              <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" 
                                checked={plannerForm.isRecurring} onChange={e => setPlannerForm({...plannerForm, isRecurring: e.target.checked})} />
                              <span className="font-bold text-indigo-900 text-sm">Make recurring (Weekly for 2 months)</span>
                            </label>
                          </>
                        )}

                        {/* LOG DIRECTLY TO LESSON SCHEDULE */}
                        {plannerModal.data && (
                          <button type="button" onClick={() => {
                            const d = new Date(plannerModal.data.startDate);
                            const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

                            setSchemeForm({
                              date: localDateStr,
                              startTime: new Date(plannerModal.data.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}),
                              endTime: new Date(plannerModal.data.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}),
                              title: 'Class Taken',
                              weekNo: '',
                              topic: '',
                              description: '',
                              classStatus: 'Class Taken',
                              yearGroupFilter: plannerModal.data.yearGroupFilter || 'all',
                              studentId: plannerModal.data.studentId || 'all'
                            });
                            setPlannerModal({ show: false, selectedDate: null, data: null });
                            navigate(user?.role === 'grader' ? '/grader-dashboard/scheme' : '/admin-dashboard/scheme');
                            setIsSchemeModalOpen(true);
                          }} className="w-full py-3 sm:py-4 mt-4 sm:mt-6 mb-2 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 shadow-md flex justify-center items-center gap-2 text-sm sm:text-base">
                            Log Daily Report in Lesson Schedule
                          </button>
                        )}

                        {!plannerModal.data ? (
                          <div className="flex gap-3 sm:gap-4 mt-4 sm:mt-6">
                            <button type="button" onClick={() => setPlannerModal({show: false})} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-sm sm:text-base transition-colors">
                              Cancel
                            </button>
                            <button type="submit" className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 text-sm sm:text-base transition-colors shadow-sm">
                              Save Class
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2">
                            <button type="button" onClick={() => setPlannerModal({show: false})} className="w-full py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-sm sm:text-base transition-colors">
                              Cancel
                            </button>
                            <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 text-sm sm:text-base transition-colors shadow-sm">
                              Save Class
                            </button>
                            <button type="button" onClick={() => handlePlannerDelete(plannerModal.data._id, false)} className={`w-full py-3.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 text-sm sm:text-base transition-colors shadow-sm ${!plannerModal.data.isRecurring ? 'col-span-2' : ''}`}>
                              Delete One
                            </button>
                            {plannerModal.data.isRecurring && (
                              <button type="button" onClick={() => handlePlannerDelete(plannerModal.data._id, true)} className="w-full py-3.5 bg-red-700 text-white font-bold rounded-xl hover:bg-red-800 text-sm sm:text-base transition-colors shadow-sm">
                                Delete Series
                              </button>
                            )}
                          </div>
                        )}
                      </form>
                    </div>
                  </div>
                )}

                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 border-b border-slate-100 pb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-500 w-2 h-8 rounded-full"></div>
                    <h2 className="text-2xl font-black text-[#1B2559]">Class Planner</h2>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-start sm:items-center">
                    <button onClick={handleExportPlannerPDF} className="w-full sm:w-auto px-4 py-3 bg-slate-50 text-slate-700 hover:bg-slate-700 hover:text-white font-black rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 border border-slate-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      Export PDF
                    </button>

                    <div className="flex gap-2 bg-[#F4F7FE] p-2 rounded-2xl w-full sm:w-auto overflow-x-auto">
                      <button onClick={() => setPlannerFilter('calendar')} className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${plannerFilter === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}>Calendar</button>
                      <button onClick={() => setPlannerFilter('day')} className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${plannerFilter === 'day' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}>Day</button>
                      <button onClick={() => setPlannerFilter('week')} className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${plannerFilter === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}>Week</button>
                      <button onClick={() => setPlannerFilter('month')} className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap ${plannerFilter === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}>Month</button>
                    </div>
                  </div>

                  {plannerFilter === 'calendar' && (
                    <div className="flex items-center gap-4 bg-[#F4F7FE] p-2 rounded-2xl">
                      <button onClick={() => setPlannerCurrentDate(new Date(year, month - 1, 1))} className="p-3 bg-white hover:bg-slate-100 rounded-xl shadow-sm">{'<'}</button>
                      <h3 className="text-xl font-black text-[#1B2559] min-w-[160px] text-center">{monthNames[month]} {year}</h3>
                      <button onClick={() => setPlannerCurrentDate(new Date(year, month + 1, 1))} className="p-3 bg-white hover:bg-slate-100 rounded-xl shadow-sm">{'>'}</button>
                    </div>
                  )}
                </div>

                {/* Calendar View */}
                {plannerFilter === 'calendar' ? (
                  <div id="planner-calendar-view" className="bg-white p-2 -mx-2 rounded-xl">
                    <div className="grid grid-cols-7 gap-2 md:gap-4 mb-4">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="text-center font-black text-[#A3AED0] uppercase text-xs tracking-wider">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2 md:gap-4">
                      {Array.from({ length: emptyDays }).map((_, i) => (
                        <div key={`empty-${i}`} className="min-h-[100px] md:min-h-[120px] bg-slate-50/50 rounded-2xl border border-dashed border-slate-200"></div>
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const daySessions = getSessionsForDay(day);
                        return (
                          <div key={day} onClick={() => {
                            setPlannerForm({ topic: '', weekNo: '', title: '', startTime: '', endTime: '', isRecurring: false, yearGroupFilter: 'all', studentId: '' });
                            setPlannerModal({show: true, selectedDate: dateStr, data: null});
                          }}
                               className="min-h-[100px] md:min-h-[120px] p-2 md:p-3 rounded-2xl border bg-white border-slate-100 hover:border-indigo-300 cursor-pointer transition-all">
                            <div className="text-xs md:text-sm font-black w-7 h-7 flex items-center justify-center rounded-full mb-2 text-[#1B2559]">{day}</div>
                            <div className="space-y-1 overflow-y-auto max-h-[85px] custom-scrollbar">
                            {daySessions.slice(0, 4).map(session => {
                              const status = getSessionStatus(session);
                              const colorClass = status === 'logged' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : status === 'missed' ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200';
                              const badgeColor = status === 'logged' ? 'text-emerald-900' : status === 'missed' ? 'text-rose-900' : 'text-indigo-900';
                              
                              return (
                              <div key={session._id} onClick={(e) => { e.stopPropagation(); setPlannerForm({ topic: session.topic, weekNo: session.weekNo || '', title: session.title || session.topic, startTime: new Date(session.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}), endTime: new Date(session.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}), isRecurring: session.isRecurring, yearGroupFilter: session.yearGroupFilter || 'all', studentId: session.studentId || 'all' }); setPlannerModal({show: true, selectedDate: dateStr, data: session}); }}
                                className={`text-[10px] leading-tight font-bold px-1 py-0.5 rounded-md shadow-sm flex items-center gap-1.5 overflow-hidden whitespace-nowrap cursor-pointer ${colorClass}`} title={session.topic}>
                                <span className={`shrink-0 bg-white font-black px-1 rounded shadow-sm ${badgeColor}`}>
                                  {new Date(session.startDate).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                </span>
                                <span className="truncate pr-1">
                                  {session.studentId && session.studentId !== 'all' 
                                  ? (students.find(s => s._id === session.studentId)?.name?.split(' ')[0] || 'Unknown') 
                                  : 'All'}
                                </span>
                              </div>
                              );
                            })}
                        {daySessions.length > 4 && (
                        <div className="text-[10px] font-black text-slate-500 text-center bg-slate-100 rounded py-0.5 mt-1">
                          +{daySessions.length - 4} more
                        </div>
                        )}
                        </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                    {generateList().map(session => {
                      const status = getSessionStatus(session);
                      const badgeClass = status === 'logged' ? 'bg-emerald-100 text-emerald-700' : status === 'missed' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700';
                      
                      return (
                        <div key={session._id} className="p-5 bg-[#F4F7FE] rounded-2xl flex justify-between items-center border border-slate-100">
                          <div>
                            <p className="text-xs font-bold text-[#A3AED0] mb-1">{new Date(session.startDate).toLocaleDateString()}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <h3 className="font-black text-lg text-[#1B2559] break-words">
                                {session.topic || 'Class Session'}
                              </h3>
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md w-fit ${badgeClass}`}>
                                {session.studentId && session.studentId !== 'all' 
                                  ? `👤 ${students.find(s => s._id === session.studentId)?.registrationName || students.find(s => s._id === session.studentId)?.name || 'Unknown'}` 
                                  : '📢 Entire Class'}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-indigo-500 mt-1">
                              {new Date(session.startDate).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - {new Date(session.endDate).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                              {session.isRecurring && <span className="ml-3 bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-[10px] uppercase">Recurring</span>}
                            </p>
                          </div>
                          <button onClick={() => handlePlannerDelete(session._id, false)} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white font-bold transition-colors">Delete</button>
                        </div>
                      );
                    })}
                    {generateList().length === 0 && <p className="text-center font-bold text-slate-400 py-10">No classes scheduled for this view.</p>}
                  </div>
                )}
              </div>
            );
          })()}

          {/* VIEW: TOPIC PROGRESS TRACKER */}
          {activeTab === 'topics' && (
            <div className="animate-fade-in relative">
              
              {/* TOPIC MODAL (POPUP) */}
              {isTopicModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                  <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl transform scale-100 animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                      <div className="bg-sky-500 w-2 h-8 rounded-full"></div>
                      <h2 className="text-2xl font-black text-[#1B2559]">
                        {editingTopicId ? 'Edit Topic Record' : 'Add Topic Record'}
                      </h2>
                    </div>
                    
                    <form onSubmit={handleTopicSubmit} className="space-y-4">
                      <div>
                        <label className="text-xs font-black text-[#A3AED0] uppercase">Area Name</label>
                        <input type="text" required className="w-full p-4 mt-1 bg-[#F4F7FE] border-none rounded-xl font-bold outline-none focus:ring-4 focus:ring-sky-500/20 text-[#1B2559]" 
                          placeholder="e.g. Mathematics" value={topicForm.areaName} onChange={e => setTopicForm({...topicForm, areaName: e.target.value})} />
                      </div>

                      <div>
                        <label className="text-xs font-black text-[#A3AED0] uppercase">Topic Name</label>
                        <input type="text" required className="w-full p-4 mt-1 bg-[#F4F7FE] border-none rounded-xl font-bold outline-none focus:ring-4 focus:ring-sky-500/20 text-[#1B2559]" 
                          placeholder="e.g. Algebra Fundamentals" value={topicForm.topicName} onChange={e => setTopicForm({...topicForm, topicName: e.target.value})} />
                      </div>

                      <div>
                        <label className="text-xs font-black text-[#A3AED0] uppercase">Grade</label>
                        <input type="text" required className="w-full p-4 mt-1 bg-[#F4F7FE] border-none rounded-xl font-bold outline-none focus:ring-4 focus:ring-sky-500/20 text-[#1B2559]" 
                          placeholder="e.g. Grade 7" value={topicForm.grade} onChange={e => setTopicForm({...topicForm, grade: e.target.value})} />
                      </div>
                      
                      <div>
                        <label className="text-xs font-black text-[#A3AED0] uppercase">Year Level</label>
                        <input type="text" className="w-full p-4 mt-1 bg-[#F4F7FE] border-none rounded-xl font-bold outline-none focus:ring-4 focus:ring-sky-500/20 text-[#1B2559]" 
                          placeholder="e.g. Y8" value={topicForm.yearLevel} onChange={e => setTopicForm({...topicForm, yearLevel: e.target.value})} />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-black text-[#A3AED0] uppercase">Sparx Code</label>
                          <input type="text" className="w-full p-4 mt-1 bg-[#F4F7FE] border-none rounded-xl font-bold outline-none focus:ring-4 focus:ring-sky-500/20 text-[#1B2559]" 
                            placeholder="e.g. U189" value={topicForm.sparxCode} onChange={e => setTopicForm({...topicForm, sparxCode: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-xs font-black text-[#A3AED0] uppercase">Past Papers URL</label>
                          <input type="url" className="w-full p-4 mt-1 bg-[#F4F7FE] border-none rounded-xl font-bold outline-none focus:ring-4 focus:ring-sky-500/20 text-[#1B2559]" 
                            placeholder="https://..." value={topicForm.pastPaperQues} onChange={e => setTopicForm({...topicForm, pastPaperQues: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-xs font-black text-[#A3AED0] uppercase">FlashCards URL</label>
                          <input type="url" className="w-full p-4 mt-1 bg-[#F4F7FE] border-none rounded-xl font-bold outline-none focus:ring-4 focus:ring-sky-500/20 text-[#1B2559]" 
                            placeholder="https://..." value={topicForm.flashCards} onChange={e => setTopicForm({...topicForm, flashCards: e.target.value})} />
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <label className="text-xs font-black text-[#A3AED0] uppercase mb-2 block">Student Confidence Level (Optional)</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-rose-700">
                            <input type="radio" name="confidence" value="Red" checked={topicForm.studentConfidence === 'Red'} onChange={e => setTopicForm({...topicForm, studentConfidence: e.target.value})} className="w-4 h-4 text-rose-500 focus:ring-rose-500" />
                            🔴 Red
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-amber-700">
                            <input type="radio" name="confidence" value="Amber" checked={topicForm.studentConfidence === 'Amber'} onChange={e => setTopicForm({...topicForm, studentConfidence: e.target.value})} className="w-4 h-4 text-amber-500 focus:ring-amber-500" />
                            🟡 Amber
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-emerald-700">
                            <input type="radio" name="confidence" value="Green" checked={topicForm.studentConfidence === 'Green'} onChange={e => setTopicForm({...topicForm, studentConfidence: e.target.value})} className="w-4 h-4 text-emerald-500 focus:ring-emerald-500" />
                            🟢 Green
                          </label>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <label className="text-xs font-black text-[#A3AED0] uppercase mb-2 block">Dates Covered (Optional)</label>
                        <div className="space-y-2">
                          {topicForm.datesCovered.map((date, index) => (
                            <div key={index} className="flex gap-2">
                              <input type="date" className="w-full p-3 bg-white border border-slate-200 rounded-lg font-bold outline-none focus:ring-2 focus:ring-sky-500 text-[#1B2559]" 
                                value={date} onChange={e => {
                                  const newDates = [...topicForm.datesCovered];
                                  newDates[index] = e.target.value;
                                  setTopicForm({...topicForm, datesCovered: newDates});
                                }} />
                              {topicForm.datesCovered.length > 1 && (
                                <button type="button" onClick={() => {
                                  const newDates = topicForm.datesCovered.filter((_, i) => i !== index);
                                  setTopicForm({...topicForm, datesCovered: newDates});
                                }} className="px-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg font-black transition-colors">X</button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button type="button" onClick={() => setTopicForm({...topicForm, datesCovered: [...topicForm.datesCovered, '']})} 
                          className="mt-3 w-full py-2 border-2 border-dashed border-sky-200 text-sky-600 rounded-lg font-bold hover:bg-sky-50 transition-colors text-sm">
                          + Add Another Date
                        </button>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button type="button" onClick={() => {
                          setIsTopicModalOpen(false);
                          setEditingTopicId(null);
                          setTopicForm({ topicName: '', areaName: '', grade: '', yearLevel: '', studentConfidence: '', datesCovered: [''] });
                        }} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-colors">
                          Cancel
                        </button>
                        <button type="submit" className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-black py-4 rounded-xl transition-all shadow-lg">
                          {editingTopicId ? 'Update Record' : 'Save Record'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* FULL-WIDTH DATABASE TABLE */}
              <div className="bg-white p-8 rounded-[2rem] shadow-[0_18px_40px_rgba(112,144,176,0.12)] min-h-[600px]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-500 w-2 h-8 rounded-full"></div>
                    <h2 className="text-2xl font-black text-[#1B2559]">Topics Covered</h2>
                  </div>
                  
                 <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-wrap justify-end">
                    <div className="relative">
                      <input type="text" placeholder="Search topics, area, or grade..." 
                        className="w-full sm:w-72 p-3 pl-4 bg-[#F4F7FE] border-none rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-[#1B2559]"
                        value={topicSearchTerm} onChange={e => setTopicSearchTerm(e.target.value)} />
                    </div>
                    
                    <button onClick={handleExportTopicsCSV} className="px-4 py-3 bg-slate-50 text-slate-700 hover:bg-slate-700 hover:text-white font-black rounded-xl transition-colors shadow-sm flex items-center gap-2 border border-slate-200 whitespace-nowrap">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      Export CSV
                    </button>
                    
                    <button onClick={handleExportTopicsPDF} className="px-4 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white font-black rounded-xl transition-colors shadow-sm flex items-center gap-2 border border-indigo-100 whitespace-nowrap">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      Export PDF
                    </button>

                    <button disabled={!topicSelectedStudent} onClick={() => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      setTopicForm({ topicName: '', areaName: '', grade: '', yearLevel: '', studentConfidence: '', datesCovered: [todayStr] });
                      setEditingTopicId(null);
                      setIsTopicModalOpen(true);
                    }} className={`px-6 py-3 font-black rounded-xl shadow-lg transition-transform flex items-center justify-center gap-2 whitespace-nowrap
                      ${!topicSelectedStudent ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:-translate-y-1'}`}>
                      <span>+</span> Add New Topic
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 sm:items-end">
                  
                  <div className="flex-1 min-w-[110px]">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Filter by Year</label>
                    <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm"
                      value={topicYearFilter} onChange={e => { setTopicYearFilter(e.target.value); setTopicSelectedStudent(''); setTopicGradeFilter('all'); setTopicYearLevelFilter('all'); }}>
                      <option value="all">All Years</option>
                      {[...new Set(students.map(s => s.yearGroup).filter(Boolean))].map(yg => (
                        <option key={yg} value={yg}>{yg}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-[1.5] min-w-[150px]">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Select Student</label>
                    <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm"
                      value={topicSelectedStudent} onChange={e => { setTopicSelectedStudent(e.target.value); setTopicGradeFilter('all'); setTopicYearLevelFilter('all'); }}>
                      <option value="">-- Choose a Student --</option>
                      {students
                        .filter(s => topicYearFilter === 'all' || s.yearGroup === topicYearFilter)
                        .sort((a, b) => (a.registrationName || a.name).localeCompare(b.registrationName || b.name))
                        .map(s => (
                        <option key={s._id} value={s._id}>{s.registrationName || s.name} {s.yearGroup ? `- ${s.yearGroup}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1 min-w-[110px]">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Filter by Grade</label>
                    <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm disabled:opacity-50"
                      value={topicGradeFilter} onChange={e => setTopicGradeFilter(e.target.value)} disabled={!topicSelectedStudent}>
                      <option value="all">All Grades</option>
                      {[...new Set(topics.filter(t => t.studentId?._id === topicSelectedStudent).map(t => t.grade).filter(Boolean))]
                        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
                        .map(g => (
                          <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 min-w-[110px]">
                    <label className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide">Filter by Level</label>
                    <select className="w-full py-2.5 px-3 mt-1 bg-white border border-slate-200 rounded-lg outline-none font-bold text-[#1B2559] text-sm disabled:opacity-50"
                      value={topicYearLevelFilter} onChange={e => setTopicYearLevelFilter(e.target.value)} disabled={!topicSelectedStudent}>
                      <option value="all">All Levels</option>
                      {[...new Set(topics.filter(t => t.studentId?._id === topicSelectedStudent).map(t => t.yearLevel).filter(Boolean))].map(yl => (
                        <option key={yl} value={yl}>{yl}</option>
                      ))}
                    </select>
                  </div>

                  <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0 flex gap-2">
                    {user?.role === 'admin' && topicSelectedStudent && processedTopics.length > 0 && (
                      <button 
                      onClick={() => setModal({ type: 'deleteAllTopics', data: topicSelectedStudent })} 
                      className="px-4 py-2.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg font-black transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap border border-rose-200 hover:border-transparent text-sm"
                      >
                    🗑️ Delete All
                    </button>
                    )}
                    <div>
                      <input type="file" accept=".csv" id="csv-upload" className="hidden" onChange={handleCSVUpload} />
                      <label htmlFor={topicSelectedStudent && !isUploadingCSV ? "csv-upload" : ""} 
                        className={`w-full sm:w-auto px-4 py-2.5 font-black rounded-lg shadow-sm transition-transform flex items-center justify-center gap-2 whitespace-nowrap text-sm
                          ${!topicSelectedStudent ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : isUploadingCSV ? 'bg-emerald-300 text-emerald-800 cursor-wait' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:-translate-y-1 cursor-pointer border border-emerald-200'}`}>
                        {isUploadingCSV ? '⏳ Uploading...' : 'Import CSV'}
                      </label>
                    </div>
                  </div>
                </div>

                {/* BULK DATE */}
                {topicSelectedStudent && processedTopics.length > 0 && (
                  <div className="mb-6 p-5 bg-white border-2 border-indigo-50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-fade-in relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>
                    
                    <div className="flex items-center gap-4 pl-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#A3AED0] uppercase tracking-wide">Selected</span>
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg transition-colors ${selectedTopicIds.length > 0 ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                          {selectedTopicIds.length}
                        </span>
                      </div>
                      
                      <div className="w-px h-5 bg-slate-200"></div>
                      
                      <button 
                        type="button"
                        onClick={() => {
                          if (selectedTopicIds.length === processedTopics.length && processedTopics.length > 0) setSelectedTopicIds([]);
                          else setSelectedTopicIds(processedTopics.map(t => t._id));
                        }}
                        className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors flex items-center gap-1.5 outline-none"
                      >
                        {selectedTopicIds.length === processedTopics.length && processedTopics.length > 0 ? '⨯ Deselect All' : '✓ Select All'}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                      <div className="flex items-center gap-3 w-full sm:w-auto bg-[#F4F7FE] p-1.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-[#A3AED0] uppercase tracking-wide pl-3 hidden sm:block">Assign Date</span>
                        <input 
                          type="date" 
                          value={bulkDate} 
                          onChange={e => setBulkDate(e.target.value)} 
                          className="py-2.5 px-4 bg-white border border-slate-200 rounded-lg font-bold text-sm text-[#1B2559] outline-none focus:ring-2 focus:ring-indigo-500 flex-1 sm:flex-none cursor-pointer" 
                        />
                      </div>
                      <button 
                        type="button"
                        disabled={selectedTopicIds.length === 0}
                        onClick={async () => {
                          if (selectedTopicIds.length === 0) return;
                          try {
                            await api.post('/topics/bulk-date', { topicIds: selectedTopicIds, date: bulkDate });
                            showToast(`Date assigned to ${selectedTopicIds.length} topics successfully!`);
                            setSelectedTopicIds([]);
                            fetchTopics();
                          } catch (err) {
                            showToast("Failed to assign dates", "error");
                          }
                        }}
                        className={`w-full sm:w-auto px-6 py-3.5 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap
                          ${selectedTopicIds.length === 0 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                            : 'bg-[#1B2559] hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 transform hover:-translate-y-1'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                        Apply to {selectedTopicIds.length}
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto w-full max-w-full pb-4 relative max-h-[600px] custom-scrollbar">
                  <table className="w-full min-w-[800px] text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-indigo-600 text-white text-xs font-black uppercase tracking-wider sticky top-0 z-10 align-top shadow-sm">
                        <th className="p-4 rounded-tl-2xl w-14 text-center">
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-indigo-700 transition-colors" onClick={() => handleSortTopics('areaName')}>
                          Area {topicSortConfig.key === 'areaName' ? (topicSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-indigo-700 transition-colors leading-tight" onClick={() => handleSortTopics('topicName')}>
                          Topic<br/>Name {topicSortConfig.key === 'topicName' ? (topicSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-indigo-700 transition-colors" onClick={() => handleSortTopics('grade')}>
                          Grade {topicSortConfig.key === 'grade' ? (topicSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-indigo-700 transition-colors leading-tight" onClick={() => handleSortTopics('yearLevel')}>
                          Year<br/>Level {topicSortConfig.key === 'yearLevel' ? (topicSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 leading-tight cursor-pointer hover:bg-indigo-700 transition-colors" onClick={() => handleSortTopics('sparxCode')}>
                          Sparx<br/>Codes {topicSortConfig.key === 'sparxCode' ? (topicSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 leading-tight text-center">Past Exam<br/>Qs</th>
                        <th className="p-4 leading-tight">Flash<br/>Cards</th>
                        <th className="p-4 leading-tight">Dates<br/>Covered</th>
                        <th className="p-4 cursor-pointer hover:bg-indigo-700 transition-colors leading-tight" onClick={() => handleSortTopics('studentConfidence')}>
                          Student<br/>Confidence {topicSortConfig.key === 'studentConfidence' ? (topicSortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                        </th>
                        <th className="p-4 rounded-tr-2xl text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!topicSelectedStudent ? (
                        <tr>
                          <td colSpan="11" className="text-center py-10 text-slate-500 font-black">
                            Please select a student from the dropdown above to view their topics.
                          </td>
                        </tr>
                      ) : processedTopics.map((topic, index) => (
                        <tr key={topic._id} className={`border-b border-slate-200 hover:bg-slate-200 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-purple-100'}`}>
                          <td className="p-4">
                            <div className="flex items-center justify-center">
                              <input 
                                type="checkbox" 
                                className="w-5 h-5 rounded cursor-pointer accent-indigo-600 hover:scale-110 transition-transform drop-shadow-sm"
                                checked={selectedTopicIds.includes(topic._id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedTopicIds([...selectedTopicIds, topic._id]);
                                  else setSelectedTopicIds(selectedTopicIds.filter(id => id !== topic._id));
                                }}
                              />
                            </div>
                          </td>
                          <td className="p-4 font-bold text-slate-600">{topic.areaName}</td>
                          <td className="p-4 font-black text-[#1B2559] whitespace-normal min-w-[160px] leading-snug">
                            {(() => {
                              const words = (topic.topicName || '').trim().split(/\s+/);
                              if (words.length >= 3) {
                                return (
                                  <>
                                    {words.slice(0, 2).join(' ')}
                                    <br />
                                    {words.slice(2).join(' ')}
                                  </>
                                );
                              }
                              return topic.topicName;
                            })()}
                          </td>
                          <td className="p-4">
                            {topic.grade && topic.grade !== 'N/A' ? (
                              <span className="bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 px-2 py-1 rounded-md font-black text-xs">
                                {topic.grade}
                              </span>
                            ) : (
                              <span className="font-bold text-slate-500">-</span>
                            )}
                          </td>
                          <td className="p-4 font-bold text-[#1B2559]">{topic.yearLevel || '-'}</td>
                          <td className="p-4 font-bold text-slate-500 text-sm">
                          {(() => {
                            if (!topic.sparxCode || topic.sparxCode === '-' || topic.sparxCode === 'N/A') return '-';
                            
                            const isList = topic.sparxCode.includes(',');
                            const separator = isList ? ',' : ' ';
                            const joiner = isList ? ', ' : ' ';
                            
                            const items = topic.sparxCode.split(separator).map(item => item.trim()).filter(Boolean);
                            
                            if (items.length <= 2) return topic.sparxCode;
                            
                            const rows = [];
                            for (let i = 0; i < items.length; i += 2) {
                              rows.push(items.slice(i, i + 2).join(joiner));
                            }
                            
                            return rows.map((r, i) => (
                              <React.Fragment key={i}>
                                {r}
                                {i < rows.length - 1 && <br />}
                              </React.Fragment>
                            ));
                          })()}
                        </td>
                          <td className="p-4">
                            {topic.pastPaperQues ? (
                              <a href={topic.pastPaperQues} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 underline font-bold text-xs">Click Here</a>
                            ) : <span className="text-slate-400 font-bold">-</span>}
                          </td>
                          <td className="p-4">
                            {topic.flashCards ? (
                              <a href={topic.flashCards} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 underline font-bold text-xs">Click Here</a>
                            ) : <span className="text-slate-400 font-bold">-</span>}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1 max-w-[250px]">
                              {topic.datesCovered.filter(d => d.trim() !== '').map((date, i) => (
                                <span key={i} className="text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded">
                                  {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              ))}
                              {topic.datesCovered.filter(d => d.trim() !== '').length === 0 && <span className="text-slate-400 font-bold">-</span>}
                            </div>
                          </td>
                          <td className="p-4">
                            {topic.studentConfidence ? (
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm
                                ${topic.studentConfidence === 'Green' ? 'bg-emerald-100 text-emerald-700' : 
                                  topic.studentConfidence === 'Amber' ? 'bg-amber-100 text-amber-700' : 
                                  'bg-rose-100 text-rose-700'}`}>
                                {topic.studentConfidence === 'Green' ? '🟢 Green' : topic.studentConfidence === 'Amber' ? '🟡 Amber' : '🔴 Red'}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-bold text-xs">-</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center items-center gap-2">
                              <button onClick={() => handleEditTopic(topic)} className="p-2 bg-indigo-50 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-lg transition-colors shadow-sm" title="Edit Topic">
                                ✏️
                              </button>
                              <button onClick={() => handleDeleteTopic(topic._id)} className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors shadow-sm" title="Delete Topic">
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {topicSelectedStudent && processedTopics.length === 0 && (
                    <tr>
                      <td colSpan="11" className="text-center py-10 text-slate-400 font-bold">No topic records found for the selected student.</td>
                    </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}