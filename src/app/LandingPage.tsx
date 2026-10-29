import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { User, Briefcase, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { loginWithDemo } = useAuth();
  const navigate = useNavigate();
  const startDemo = () => {
    loginWithDemo();
    navigate('/app', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#111827] flex flex-col justify-between selection:bg-[#A7F3D0] selection:text-[#047857]">
      {/* Navigation Header */}
      <header className="h-20 max-w-6xl mx-auto w-full px-4 sm:px-6 flex items-center justify-between border-b border-slate-200/60">
        <Logo size={28} />
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary" size="sm" className="shadow-xs">
              Get started
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Hero & Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-12 lg:py-20 space-y-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="accent" size="md" className="mx-auto">
            Your life. In sync.
          </Badge>
          <h1 className="font-heading font-bold text-3xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight leading-tight">
            Make space for what matters.
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            One place for your personal life and professional world. Plan better, work smarter, and keep everything in balance.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2 shadow-sm">
                <span>Start organizing today</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={startDemo}
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-800"
            >
              ⚡ Try Interactive Demo
            </Button>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto text-slate-600 hover:text-slate-900">
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        {/* 3-Column Concept Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[16px] border border-slate-200/90 shadow-[0_1px_2px_rgba(17,24,39,0.06)] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#ECFDF5] text-[#047857] flex items-center justify-center mb-4">
                <User className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-lg text-slate-900 mb-2">Personal</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Keep daily habits, errands, home priorities, and wellbeing neatly organized in a peaceful dedicated space.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-[#047857]">
              <span>Mint Accent System</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[16px] border border-slate-200/90 shadow-[0_1px_2px_rgba(17,24,39,0.06)] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center mb-4">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-lg text-slate-900 mb-2">Professional</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Manage deliverables, deadlines, project tasks, and team collaborations without cluttering your private life.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8]">
              <span>Sky Accent System</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[16px] border border-slate-200/90 shadow-[0_1px_2px_rgba(17,24,39,0.06)] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-lg text-slate-900 mb-2">In Sync</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Switch workspaces instantly with a single keystroke while your privacy, rules, and focus boundaries remain absolute.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <span>One Account · Two Worlds</span>
            </div>
          </div>
        </div>

        {/* Illustrative Layout Preview built from Kurashii UI Components */}
        <div className="bg-white rounded-[20px] p-6 sm:p-8 border border-slate-200 shadow-md">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-slate-300" />
              <span className="w-3 h-3 rounded-full bg-slate-300" />
              <span className="w-3 h-3 rounded-full bg-slate-300" />
              <span className="text-xs font-semibold text-slate-400 pl-2">
                Kurashii Workspace Preview
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] font-semibold">
                Personal
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] font-semibold">
                Professional
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sample Personal Focus
              </h4>
              <div className="p-4 rounded-[14px] border border-slate-200 bg-slate-50/50 flex items-start justify-between">
                <div>
                  <h5 className="text-sm font-semibold text-slate-900">Morning 30-min stretch</h5>
                  <p className="text-xs text-slate-500 mt-0.5">Health · Due 8:00 AM</p>
                </div>
                <Badge variant="accent" size="sm">Today</Badge>
              </div>
              <div className="p-4 rounded-[14px] border border-slate-200 bg-slate-50/50 flex items-start justify-between">
                <div>
                  <h5 className="text-sm font-semibold text-slate-900">Weekly grocery list</h5>
                  <p className="text-xs text-slate-500 mt-0.5">Home · Priority Medium</p>
                </div>
                <Badge variant="neutral" size="sm">Errand</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sample Work Deliverables
              </h4>
              <div className="p-4 rounded-[14px] border border-slate-200 bg-slate-50/50 flex items-start justify-between">
                <div>
                  <h5 className="text-sm font-semibold text-slate-900">Q4 roadmap presentation</h5>
                  <p className="text-xs text-slate-500 mt-0.5">Project · High Priority</p>
                </div>
                <Badge variant="sky" size="sm">Work</Badge>
              </div>
              <div className="p-4 rounded-[14px] border border-slate-200 bg-slate-50/50 flex items-start justify-between">
                <div>
                  <h5 className="text-sm font-semibold text-slate-900">Client onboarding review</h5>
                  <p className="text-xs text-slate-500 mt-0.5">Client · Follow-up</p>
                </div>
                <Badge variant="neutral" size="sm">Admin</Badge>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500 max-w-6xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Logo size={20} />
          <span className="text-slate-400">·</span>
          <span>Your life. In sync.</span>
        </div>
        <p>© 2026 Kurashii. Built with strict privacy and decoupled workspaces.</p>
      </footer>
    </div>
  );
};
