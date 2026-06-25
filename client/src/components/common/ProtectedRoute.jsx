import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Allow graders to access the 'admin' routes as well
  const hasAccess = user.role === allowedRole || (allowedRole === 'admin' && user.role === 'grader');

  if (allowedRole && !hasAccess) {
    if (user.role === 'admin' || user.role === 'grader') {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (user.role === 'parent') {
      return <Navigate to="/parent-dashboard" replace />;
    } else {
      return <Navigate to="/student-dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;