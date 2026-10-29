import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Button } from '../components/ui/Button';
import { AlertCircle, RefreshCw, LogOut } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile, profileStatus, loading, retryProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return null; // Branded loader handled by AuthProvider
  }

  // Not signed in -> redirect to /login with return path
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Read failed -> show full-page error card with Retry and Log out
  if (profileStatus === 'error') {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-center items-center px-4">
        <div className="bg-white p-8 rounded-[16px] shadow-sm border border-slate-200 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="font-heading font-bold text-xl text-slate-900 mb-2">
            We couldn&apos;t load your profile
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            There was a problem reading your account records. Please check your internet connection or try again.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => retryProfile()}
              className="w-full sm:w-auto gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await logout();
                navigate('/login', { replace: true });
              }}
              className="w-full sm:w-auto gap-2 text-slate-700"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Signed in but onboarding not finished -> redirect to /onboarding
  if (profileStatus === 'missing' || !userProfile?.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
