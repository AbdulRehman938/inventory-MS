import React from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === 'controller') {
      return <Navigate to="/controller/dashboard" replace />;
    }
  }
  
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } 
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/controller/dashboard"
          element={
            <ProtectedRoute allowedRole="controller">
              <ControllerDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
