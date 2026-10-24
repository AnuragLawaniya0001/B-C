import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function ProtectedRoute({ children, requireMembership = false }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  // Free users are fully permitted to access their dashboard.
  // Membership enforcement happens at specific feature level (e.g., Cookey, bookings).
  return children;
}

export default ProtectedRoute;
