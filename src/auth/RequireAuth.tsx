import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile, profileStatus, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  // Signed out -> /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Profile ready and onboardingComplete -> /app
  if (profileStatus === 'ready' && userProfile?.onboardingComplete) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};
