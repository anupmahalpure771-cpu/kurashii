import React, { useState, useEffect } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { BalanceMetrics } from './balanceUtils';
import {
  Scale,
  Moon,
  Sun,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Heart,
  Briefcase,
  User,
} from 'lucide-react';

interface BalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: BalanceMetrics;
  onUpdateWorkHours?: (start: number, end: number) => void;
}

export const BalanceModal: React.FC<BalanceModalProps> = ({
  isOpen,
  onClose,
  metrics,
  onUpdateWorkHours,
}) => {
  const [workStart, setWorkStart] = useState<number>(() => {
    return Number(localStorage.getItem('kurashii_work_start') || '9');
  });
  const [workEnd, setWorkEnd] = useState<number>(() => {
    return Number(localStorage.getItem('kurashii_work_end') || '18');
  });

  const handleSaveHours = () => {
    localStorage.setItem('kurashii_work_start', String(workStart));
    localStorage.setItem('kurashii_work_end', String(workEnd));
    if (onUpdateWorkHours) {
      onUpdateWorkHours(workStart, workEnd);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 65) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Life & Work Sync Analytics" size="lg">
      <div className="space-y-6">
        {/* Score Card Header */}
        <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-[#A7F3D0]">{metrics.score}%</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-300 font-bold">Sync</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#A7F3D0]" />
                Work-Life Balance Health
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {metrics.score >= 80
                  ? 'Excellent harmony between work deliverables and personal restoration.'
                  : 'Slight imbalance detected. Consider scheduling quiet time.'}
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(
              metrics.score
            )}`}
          >
            {metrics.status === 'optimal'
              ? 'Optimal Sync'
              : metrics.status === 'work_heavy'
              ? 'Work Dominant'
              : 'Personal Priority'}
          </span>
        </div>

        {/* Quiet Hours Banner */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
            metrics.isQuietHours
              ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          }`}
        >
          {metrics.isQuietHours ? (
            <Moon className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
          ) : (
            <Sun className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          )}
          <div className="flex-1 text-xs">
            <strong className="font-bold block text-sm mb-0.5">
              {metrics.isQuietHours ? 'Quiet Hours Active' : 'Active Work Hours'}
            </strong>
            <p className="text-slate-600">{metrics.quietHoursMessage}</p>
          </div>
        </div>

        {/* 2-Column Metrics Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Personal Side */}
          <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wide">
                <User className="w-4 h-4" />
                Personal Investment
              </span>
              <Heart className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-emerald-100">
                <span className="text-slate-600">Personal Tasks</span>
                <span className="font-bold text-slate-800">{metrics.personalCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-emerald-100">
                <span className="text-slate-600">Habit Check-ins Today</span>
                <span className="font-bold text-emerald-700">
                  {metrics.habitsDoneToday} of {metrics.habitsTotal}
                </span>
              </div>
            </div>
          </div>

          {/* Professional Side */}
          <div className="p-4 rounded-xl border border-blue-200/80 bg-blue-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Briefcase className="w-4 h-4" />
                Professional Load
              </span>
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-blue-100">
                <span className="text-slate-600">Active Work Tasks</span>
                <span className="font-bold text-slate-800">{metrics.workCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-blue-100">
                <span className="text-slate-600">Scheduled Call Hours</span>
                <span
                  className={`font-bold ${
                    metrics.workMeetingHours > 4 ? 'text-amber-600' : 'text-slate-800'
                  }`}
                >
                  {metrics.workMeetingHours} hrs
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Burnout Warning if meeting load is intense */}
        {metrics.workMeetingHours > 4 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              High meeting density detected ({metrics.workMeetingHours} hours). Make sure to schedule
              at least 15-minute bio breaks between consecutive calls.
            </span>
          </div>
        )}

        {/* Boundary Settings */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-left">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-600" />
            Set Your Work Boundary Hours
          </span>
          <p className="text-xs text-slate-500">
            Define when your working day starts and finishes to activate evening Quiet Hours and prevent
            late-night notification burnout.
          </p>

          <div className="flex items-center gap-4 pt-1">
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Work Starts At
              </label>
              <select
                value={workStart}
                onChange={(e) => setWorkStart(Number(e.target.value))}
                className="w-full h-8 text-xs bg-white border border-slate-200 rounded-lg px-2"
              >
                {[7, 8, 9, 10].map((h) => (
                  <option key={h} value={h}>
                    {h}:00 AM
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Work Concludes At
              </label>
              <select
                value={workEnd}
                onChange={(e) => setWorkEnd(Number(e.target.value))}
                className="w-full h-8 text-xs bg-white border border-slate-200 rounded-lg px-2"
              >
                {[16, 17, 18, 19, 20].map((h) => (
                  <option key={h} value={h}>
                    {h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-5">
              <Button size="sm" variant="outline" onClick={handleSaveHours}>
                Save Boundaries
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
