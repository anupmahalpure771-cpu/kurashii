import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
  heading: string;
  subheading: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, heading, subheading }) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F1F5F9]">
      {/* Left 45% Navy Panel (>= 1024px) */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#111827] text-white p-12 xl:p-16 flex-col justify-between selection:bg-[#A7F3D0] selection:text-[#047857]">
        <div>
          <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
            <Logo size={32} theme="light" />
          </Link>
        </div>

        <div className="space-y-8 my-auto py-12">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#A7F3D0]/20 text-[#A7F3D0] border border-[#A7F3D0]/30 mb-4">
              Your life. In sync.
            </span>
            <h1 className="font-heading font-bold text-4xl xl:text-5xl text-white tracking-tight leading-tight">
              Make space for what matters.
            </h1>
          </div>

          <div className="space-y-4 max-w-md">
            {/* Personal Card */}
            <div className="p-4 rounded-[14px] bg-slate-900/80 border border-slate-800 shadow-sm flex items-start gap-3.5">
              <span className="w-3 h-3 rounded-full bg-[#A7F3D0] mt-1 shrink-0 ring-4 ring-[#A7F3D0]/20" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#A7F3D0]">Personal</h3>
                <p className="text-sm text-slate-300 mt-0.5 leading-snug">
                  Plan daily life, habits, finances and focus in clarity.
                </p>
              </div>
            </div>

            {/* Professional Card */}
            <div className="p-4 rounded-[14px] bg-slate-900/80 border border-slate-800 shadow-sm flex items-start gap-3.5">
              <span className="w-3 h-3 rounded-full bg-[#93C5FD] mt-1 shrink-0 ring-4 ring-[#93C5FD]/20" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#93C5FD]">Professional</h3>
                <p className="text-sm text-slate-300 mt-0.5 leading-snug">
                  Deliver projects, coordinate tasks, and track team milestones.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          <p>© 2026 Kurashii · One place for your personal life and professional world.</p>
        </div>
      </div>

      {/* Right Column / Single Column (< 1024px) */}
      <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-12 xl:px-16 overflow-y-auto">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6 lg:text-left">
          <div className="lg:hidden mb-6 flex justify-center">
            <Link to="/" className="inline-block hover:opacity-90">
              <Logo size={30} />
            </Link>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 tracking-tight">
            {heading}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {subheading}
          </p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
};
