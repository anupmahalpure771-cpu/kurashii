import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export const AppRedirect: React.FC = () => {
  const { userProfile } = useAuth();
  const target = userProfile?.lastWorkspace === 'professional' ? '/app/work' : '/app/personal';
  return <Navigate to={target} replace />;
};
