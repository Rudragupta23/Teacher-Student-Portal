import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthPage from './pages/auth/AuthPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDashboard from './pages/student/StudentDashboard'; 
import ProtectedRoute from './components/common/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-center" />
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<AuthPage />} />
          
          {/* Protected Admin Route */}
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Student Route */}
          <Route 
            path="/student-dashboard" 
            element={
              <ProtectedRoute allowedRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;