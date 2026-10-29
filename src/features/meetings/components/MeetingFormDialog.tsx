import React, { useState, useEffect } from 'react';
import { Dialog } from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import {
  Meeting,
  MeetingFormData,
  ParticipantUser,
  detectMeetingConflict,
} from '../schema';
import { validateEventTimes } from '../../calendar/schema';
import { Clock, Calendar as CalendarIcon, Video, AlertTriangle, Users, AlertCircle } from 'lucide-react';

interface MeetingFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MeetingFormData) => Promise<void>;
  existingMeetings: Meeting[];
  registeredUsers: ParticipantUser[];
  currentUserId: string;
  initialMeeting?: Meeting | null;
}

export const MeetingFormDialog: React.FC<MeetingFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingMeetings,
  registeredUsers,
  currentUserId,
  initialMeeting,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialMeeting) {
      setTitle(initialMeeting.title);
      setDescription(initialMeeting.description || '');
      setDate(initialMeeting.date);
      setStartTime(initialMeeting.startTime);
      setEndTime(initialMeeting.endTime);
      setMeetingUrl(initialMeeting.meetingUrl || '');
      setSelectedParticipants(initialMeeting.participantUids || []);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setTitle('');
      setDescription('');
      setDate(today);
      setStartTime('10:00');
      setEndTime('11:00');
      setMeetingUrl('');
      setSelectedParticipants([]);
    }
    setError(null);
  }, [initialMeeting, isOpen]);

  // Check for time conflict
  const conflict = detectMeetingConflict(existingMeetings, {
    date,
    startTime,
    endTime,
    id: initialMeeting?.id,
  });

  const toggleParticipant = (uid: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Meeting title is required');
      return;
    }
    if (!date) {
      setError('Meeting date is required');
      return;
    }

    const timeErr = validateEventTimes(startTime, endTime);
    if (timeErr) {
      setError(timeErr);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        date,
        startTime,
        endTime,
        meetingUrl: meetingUrl.trim() || undefined,
        participantUids: selectedParticipants,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  // Exclude current user from participant list
  const availableUsers = registeredUsers.filter((u) => u.uid !== currentUserId);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialMeeting ? 'Edit Meeting' : 'Schedule Professional Meeting'}
      description="Plan a meeting with team members, attach a video call link, and dispatch invitations."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Conflict Warning */}
        {conflict && (
          <div className="flex items-start gap-2.5 p-3 text-xs sm:text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold">Potential Time Conflict Detected</p>
              <p className="text-amber-700 mt-0.5">
                Overlaps with &quot;{conflict.title}&quot; scheduled from {conflict.startTime} to{' '}
                {conflict.endTime} on {conflict.date}.
              </p>
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Meeting Title *
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Q4 Sprint Planning or Client Demo"
            required
            autoFocus
          />
        </div>

        {/* Date, Start, End */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Date *</span>
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Start Time *</span>
            </label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>End Time *</span>
            </label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Meeting Link */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-blue-500" />
            <span>Meeting Link (Google Meet, Zoom, Teams)</span>
          </label>
          <Input
            type="url"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder="https://meet.google.com/xyz-abcd-efg or https://zoom.us/j/..."
          />
        </div>

        {/* Participants Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Select Participants ({selectedParticipants.length} selected)</span>
            </span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
            {availableUsers.map((u) => {
              const isSelected = selectedParticipants.includes(u.uid);
              return (
                <div
                  key={u.uid}
                  onClick={() => toggleParticipant(u.uid)}
                  className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-300 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-100/70'
                  }`}
                >
                  <Avatar name={u.displayName} avatarColor={u.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {u.displayName}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">@{u.handle}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 pointer-events-none"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Meeting Description &amp; Agenda
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key discussion points, expected outcomes, or documents to review..."
            rows={2}
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="accent"
            isLoading={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {initialMeeting ? 'Save Meeting Changes' : 'Schedule Meeting & Invite'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
