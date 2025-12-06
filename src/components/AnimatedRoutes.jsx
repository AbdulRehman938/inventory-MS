import React, { Suspense } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// Skeletons
import LoginSkeleton from "./skeletons/LoginSkeleton";
import SignupSkeleton from "./skeletons/SignupSkeleton";
import DashboardSkeleton from "./skeletons/DashboardSkeleton";

// Lazy Load Pages with artificial delay for demonstration
const lazyLoad = (importFunc) => {
  return React.lazy(() => {
    return Promise.all([
      importFunc,
      new Promise((resolve) => setTimeout(resolve, 800)), // 800ms delay to show skeleton
    ]).then(([moduleExports]) => moduleExports);
  });
};

const Login = lazyLoad(import("../pages/auth/login"));
const Signup = lazyLoad(import("../pages/auth/signup"));
const ForgotPassword = lazyLoad(import("../pages/auth/forgotpassword"));
const AdminDashboard = lazyLoad(import("../pages/admin/adminDashboard"));
const ControllerDashboard = lazyLoad(
  import("../pages/controller/controllerDashboard")
);

// Protected Route Component with Role Check
const ProtectedRoute = ({ children, allowedRole }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const userRole = localStorage.getItem("userRole");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    // Redirect to appropriate dashboard if role doesn't match
    if (userRole === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === "controller") {
      return <Navigate to="/controller/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirects to landing if already authenticated)
const PublicRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  if (isAuthenticated) {
    const userRole = localStorage.getItem("userRole");
    if (userRole === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === "controller") {
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
              <Suspense fallback={<LoginSkeleton />}>
                <Login />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Suspense fallback={<SignupSkeleton />}>
                <Signup />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <Suspense fallback={<LoginSkeleton />}>
                <ForgotPassword />
              </Suspense>
            </PublicRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <Suspense fallback={<DashboardSkeleton />}>
                <AdminDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/controller/dashboard"
          element={
            <ProtectedRoute allowedRole="controller">
              <Suspense fallback={<DashboardSkeleton />}>
                <ControllerDashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
