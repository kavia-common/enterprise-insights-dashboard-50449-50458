import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute:
 * - Redirects to /login if user is not authenticated
 * - If allowedRoles is provided, checks user's role and restricts access
 */

// PUBLIC_INTERFACE
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.role)) {
      // If authenticated but role not permitted, redirect to home
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
