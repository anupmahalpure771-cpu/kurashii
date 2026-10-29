import React from 'react';
import { TaskItem, TaskStage } from '../../../types/models';
import { Badge } from '../../../components/ui/Badge';
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ListTodo,
  Calendar,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface TaskKanbanBoardProps {
  tasks: TaskItem[];
  onUpdateStage: (taskId: string, newStage: TaskStage) => void;
  onToggleComplete: (task: TaskItem) => void;
  onEditTask: (task: TaskItem) => void;
  onAddTask?: (defaultStage?: TaskStage) => void;
}

const COLUMNS: { stage: TaskStage; label: string; color: string; bg: string }[] = [
  { stage: 'backlog', label: 'Backlog', color: 'text-slate-600', bg: 'bg-slate-100/70 border-slate-200' },
  { stage: 'todo', label: 'To Do', color: 'text-amber-700', bg: 'bg-amber-50/50 border-amber-200/80' },
  { stage: 'in_progress', label: 'In Progress', color: 'text-blue-700', bg: 'bg-blue-50/50 border-blue-200/80' },
  { stage: 'review', label: 'In Review', color: 'text-purple-700', bg: 'bg-purple-50/50 border-purple-200/80' },
  { stage: 'done', label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-50/50 border-emerald-200/80' },
];

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks,
  onUpdateStage,
  onToggleComplete,
  onEditTask,
  onAddTask,
}) => {
  const getTasksForStage = (stage: TaskStage) => {
    return tasks.filter((t) => {
      if (t.stage) return t.stage === stage;
      // Default fallback if task doesn't have stage yet
      if (stage === 'done') return t.status === 'completed';
      if (stage === 'todo') return t.status === 'pending';
      return false;
    });
  };

  const getPriorityBadgeVariant = (priority: TaskItem['priority']) => {
    if (priority === 'high') return 'danger';
    if (priority === 'medium') return 'warning';
    return 'default';
  };

  const getNextStage = (curr: TaskStage): TaskStage | null => {
    const idx = COLUMNS.findIndex((c) => c.stage === curr);
    return idx < COLUMNS.length - 1 ? COLUMNS[idx + 1].stage : null;
  };

  const getPrevStage = (curr: TaskStage): TaskStage | null => {
    const idx = COLUMNS.findIndex((c) => c.stage === curr);
    return idx > 0 ? COLUMNS[idx - 1].stage : null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colTasks = getTasksForStage(col.stage);
        return (
          <div
            key={col.stage}
            className={`rounded-2xl border p-3 min-w-[240px] flex flex-col max-h-[780px] ${col.bg}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${col.color}`}>{col.label}</span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-white/90 border border-slate-200 text-slate-700 shadow-2xs">
                  {colTasks.length}
                </span>
              </div>
              {onAddTask && col.stage !== 'done' && (
                <button
                  type="button"
                  onClick={() => onAddTask(col.stage)}
                  title={`Add to ${col.label}`}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-white/60 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Task Card Roster */}
            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
              {colTasks.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic">
                  No items
                </div>
              ) : (
                colTasks.map((task) => {
                  const currentStage = task.stage || (task.status === 'completed' ? 'done' : 'todo');
                  const prevStage = getPrevStage(currentStage);
                  const nextStage = getNextStage(currentStage);
                  const subtaskCount = task.subtasks?.length || 0;
                  const completedSubtasks =
                    task.subtasks?.filter((s) => s.completed).length || 0;

                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-white border border-slate-200/90 rounded-xl shadow-xs hover:shadow-sm transition-all group"
                    >
                      {/* Priority & Category */}
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <Badge variant="default" size="sm" className="text-[10px]">
                          {task.category}
                        </Badge>
                        <Badge variant={getPriorityBadgeVariant(task.priority)} size="sm">
                          {task.priority}
                        </Badge>
                      </div>

                      {/* Title */}
                      <h4
                        onClick={() => onEditTask(task)}
                        className={`text-xs font-semibold cursor-pointer text-slate-900 hover:text-blue-600 line-clamp-2 ${
                          currentStage === 'done' ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {task.title}
                      </h4>

                      {/* Description preview */}
                      {task.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                          {task.description}
                        </p>
                      )}

                      {/* Subtasks progress */}
                      {subtaskCount > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <ListTodo className="w-3 h-3 text-slate-400" />
                            {completedSubtasks}/{subtaskCount} subtasks
                          </span>
                          <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{
                                width: `${(completedSubtasks / subtaskCount) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Due Date & Movement Controls */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]">
                        {task.dueDate ? (
                          <span className="text-slate-500 flex items-center gap-1 truncate">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {task.dueDate}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No date</span>
                        )}

                        <div className="flex items-center gap-1 shrink-0">
                          {prevStage && (
                            <button
                              type="button"
                              onClick={() => onUpdateStage(task.id, prevStage)}
                              title={`Move back to ${prevStage}`}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}
                          {nextStage && (
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateStage(task.id, nextStage);
                                if (nextStage === 'done') {
                                  onToggleComplete({ ...task, status: 'completed' });
                                }
                              }}
                              title={`Advance to ${nextStage}`}
                              className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
