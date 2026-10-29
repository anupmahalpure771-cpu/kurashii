import React, { useState } from 'react';
import { TaskItem } from '../../../types/models';
import { Badge } from '../../../components/ui/Badge';
import { IconButton } from '../../../components/ui/IconButton';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { formatReadableDate, isOverdue, isDueToday } from '../../../lib/dates';
import { toggleTaskComplete, deleteTask } from '../api';
import { useAuth } from '../../../auth/AuthProvider';
import { useToast } from '../../../components/ui/Toast';
import { Check, Edit2, Trash2, Calendar, AlertCircle } from 'lucide-react';

interface TaskCardProps {
  task: TaskItem;
  todayStr: string;
  onEdit: (task: TaskItem) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, todayStr, onEdit }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const isCompleted = task.status === 'completed';
  const overdue = !isCompleted && isOverdue(task.dueDate, todayStr);
  const dueToday = !isCompleted && isDueToday(task.dueDate, todayStr);

  const handleToggle = async () => {
    if (!user || isToggling) return;
    setIsToggling(true);
    try {
      await toggleTaskComplete(user.uid, task.id, task.status);
      toast.success(isCompleted ? 'Task reopened' : 'Task completed');
    } catch (err) {
      toast.error('Failed to update task status');
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await deleteTask(user.uid, task.id);
      toast.success('Task deleted');
      setShowConfirmDelete(false);
    } catch (err) {
      toast.error('Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const priorityBadges = {
    high: <Badge variant="danger" size="sm">High</Badge>,
    medium: <Badge variant="warning" size="sm">Medium</Badge>,
    low: <Badge variant="neutral" size="sm">Low</Badge>,
  }[task.priority];

  return (
    <>
      <div
        className={`bg-white rounded-[16px] p-4 sm:p-5 border transition-all duration-150 flex flex-col gap-3 group shadow-[0_1px_2px_rgba(17,24,39,0.06)] hover:shadow-[0_4px_12px_rgba(17,24,39,0.08)] hover:-translate-y-[1px] ${
          overdue ? 'border-red-200/90 bg-red-50/20' : 'border-slate-200/80'
        }`}
      >
        <div className="flex items-start gap-3.5">
          {/* Tick button */}
          <button
            type="button"
            role="checkbox"
            aria-checked={isCompleted}
            aria-label={isCompleted ? `Mark '${task.title}' as incomplete` : `Mark '${task.title}' as complete`}
            disabled={isToggling}
            onClick={handleToggle}
            className={`w-5 h-5 rounded-[6px] border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-colors ${
              isCompleted
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'border-slate-300 hover:border-slate-600 bg-white'
            }`}
          >
            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          {/* Title & Description */}
          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm font-semibold leading-snug break-words ${
                isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p
                className={`text-xs mt-1 leading-relaxed whitespace-pre-wrap break-words ${
                  isCompleted ? 'text-slate-400 line-through' : 'text-slate-600'
                }`}
              >
                {task.description}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton
              size="sm"
              aria-label={`Edit task '${task.title}'`}
              onClick={() => onEdit(task)}
              className="text-slate-500 hover:text-slate-900"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </IconButton>
            <IconButton
              size="sm"
              variant="danger"
              aria-label={`Delete task '${task.title}'`}
              onClick={() => setShowConfirmDelete(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </IconButton>
          </div>
        </div>

        {/* Badges, Category, Due date */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100/80">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default" size="sm">
              {task.category}
            </Badge>
            {priorityBadges}
          </div>

          {task.dueDate && (
            <div
              className={`inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums ${
                overdue
                  ? 'text-red-600'
                  : dueToday
                  ? 'text-amber-700'
                  : 'text-slate-500'
              }`}
            >
              {overdue ? (
                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              ) : (
                <Calendar className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>
                {overdue ? 'Overdue: ' : dueToday ? 'Due today: ' : 'Due: '}
                {formatReadableDate(task.dueDate)}
              </span>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Task"
        description={`Are you sure you want to permanently delete '${task.title}'? This action cannot be undone.`}
        confirmLabel="Delete task"
        isLoading={isDeleting}
      />
    </>
  );
};
