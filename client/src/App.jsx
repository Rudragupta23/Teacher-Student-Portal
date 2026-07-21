import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/home/HomePage';

import AuthPage from './pages/auth/AuthPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDashboard from './pages/student/StudentDashboard'; 
import ProtectedRoute from './components/common/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import ParentDashboard from './pages/parent/ParentDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-center" />
        <Routes>
          {/* New Public Landing Page */}
          <Route path="/" element={<HomePage />} />

          {/* The Login Page is now at /login */}
          {/* <Route path="/login" element={<AuthPage />} /> */}
          <Route path="/login" element={<AuthPage defaultView="login" defaultParentMode={false} />} />
          <Route path="/signup" element={<AuthPage defaultView="signup" defaultParentMode={false} />} />
          <Route path="/parent-signup" element={<AuthPage defaultView="signup" defaultParentMode={true} />} />
          <Route path="/forgot-password" element={<AuthPage defaultView="forgot" defaultParentMode={false} />} />
          
          {/* Protected Admin Routes */}
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-dashboard/:tab" 
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          {/* Protected Grader Routes */}
          <Route 
            path="/grader-dashboard" 
            element={
              <ProtectedRoute allowedRole="grader">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/grader-dashboard/:tab" 
            element={
              <ProtectedRoute allowedRole="grader">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Student Routes */}
          <Route 
            path="/student-dashboard" 
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student-dashboard/:tab" 
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Parent Routes */}
          <Route 
            path="/parent-dashboard" 
            element={
              <ProtectedRoute allowedRole="parent">
                <ParentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/parent-dashboard/:tab" 
            element={
              <ProtectedRoute allowedRole="parent">
                <ParentDashboard />
              </ProtectedRoute>
            } 
          />
          
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;