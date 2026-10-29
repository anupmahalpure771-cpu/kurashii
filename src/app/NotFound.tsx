import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col justify-center items-center px-4 text-center">
      <Logo size={36} />
      <h1 className="mt-6 font-heading font-bold text-4xl text-slate-900">404</h1>
      <p className="mt-2 text-base text-slate-600 font-medium">Page not found</p>
      <p className="mt-1 text-xs text-slate-400 max-w-sm">
        The page you are looking for doesn&apos;t exist or has moved.
      </p>
      <div className="mt-6">
        <Link to="/app">
          <Button variant="primary" size="md" className="gap-2">
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
