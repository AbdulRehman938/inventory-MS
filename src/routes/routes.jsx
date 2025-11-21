import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/auth/login';
import Signup from '../pages/auth/signup';
import ForgotPassword from '../pages/auth/forgotpassword';
import AdminDashboard from '../pages/admin/adminDashboard';
import ControllerDashboard from '../pages/controller/controllerDashboard';

// Protected Route Component with Role Check
const ProtectedRoute = ({ children, allowedRole }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userRole = localStorage.getItem('userRole');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && userRole !== allowedRole) {
    // Redirect to appropriate dashboard if role doesn't match
    if (userRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === 'controller') {
      return <Navigate to="/controller/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route Component (redirects to landing if already authenticated)
const PublicRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Router Configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/admin/dashboard',
    element: (
      <ProtectedRoute allowedRole="admin">
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/controller/dashboard',
    element: (
      <ProtectedRoute allowedRole="controller">
        <ControllerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <PublicRoute>
        <Signup />
      </PublicRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicRoute>
        <ForgotPassword />
      </PublicRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
export { ProtectedRoute, PublicRoute };
