import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TaskItem, TaskStage, WorkspaceType } from '../../../types/models';
import { PERSONAL_CATEGORIES, PROFESSIONAL_CATEGORIES } from '../schema';
import { filterTasks } from '../taskUtils';
import { TaskCard } from './TaskCard';
import { TaskFormDialog } from './TaskFormDialog';
import { TaskKanbanBoard } from './TaskKanbanBoard';
import { useAuth } from '../../../auth/AuthProvider';
import { updateTaskStage, toggleTaskComplete } from '../api';
import { Tabs } from '../../../components/ui/Tabs';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';
import { CheckSquare, Plus, Search, LayoutList, Columns3 } from 'lucide-react';

interface TaskListProps {
  tasks: TaskItem[];
  loading: boolean;
  error: string | null;
  workspace: WorkspaceType;
  todayStr: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  loading,
  error,
  workspace,
  todayStr,
}) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dueFilter, setDueFilter] = useState('all');

  // Keep search box in sync if URL query parameter changes
  React.useEffect(() => {
    if (urlQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const categories = workspace === 'personal' ? PERSONAL_CATEGORIES : PROFESSIONAL_CATEGORIES;

  // Counts for tabs
  const pendingCount = useMemo(() => tasks.filter((t) => t.status === 'pending').length, [tasks]);
  const completedCount = useMemo(() => tasks.filter((t) => t.status === 'completed').length, [tasks]);

  // Filtered task list
  const filteredTasks = useMemo(() => {
    return filterTasks(
      tasks,
      {
        status: activeTab,
        search: searchQuery,
        priority: priorityFilter,
        category: categoryFilter,
        dueFilter: dueFilter,
      },
      todayStr
    );
  }, [tasks, activeTab, searchQuery, priorityFilter, categoryFilter, dueFilter, todayStr]);

  const handleEdit = (task: TaskItem) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleCreateNew = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  const handleStageChange = async (taskId: string, newStage: TaskStage) => {
    if (!user) return;
    try {
      await updateTaskStage(user.uid, taskId, newStage);
    } catch (err) {
      console.warn('Failed to update stage:', err);
    }
  };

  const handleToggleComplete = async (task: TaskItem) => {
    if (!user) return;
    try {
      await toggleTaskComplete(user.uid, task.id, task.status);
    } catch (err) {
      console.warn('Failed to toggle completion:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title, View Toggle and + New Task Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-[28px] text-slate-900 tracking-tight">
            {workspace === 'personal' ? 'Personal Tasks' : 'Work Tasks'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {workspace === 'personal'
              ? 'Organize your daily responsibilities, errands, and personal milestones'
              : 'Keep track of projects, deliverables, and team action items'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle: List vs Kanban Board */}
          <div className="inline-flex p-1 bg-slate-200/70 rounded-xl border border-slate-300/60">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban Board</span>
            </button>
          </div>

          <Button
            variant="primary"
            onClick={handleCreateNew}
            className="shrink-0 self-start sm:self-auto gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        /* Kanban Board View */
        <TaskKanbanBoard
          tasks={tasks}
          onUpdateStage={handleStageChange}
          onToggleComplete={handleToggleComplete}
          onEditTask={handleEdit}
          onAddTask={() => handleCreateNew()}
        />
      ) : (
        /* Standard List View */
        <>
          {/* Tabs: Pending | Completed */}
          <Tabs
            tabs={[
              { id: 'pending', label: 'Pending', count: pendingCount },
              { id: 'completed', label: 'Completed', count: completedCount },
            ]}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as 'pending' | 'completed')}
          />

          {/* Search and Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${workspace === 'personal' ? 'personal' : 'work'} tasks...`}
                className="w-full h-10 pl-10 pr-3.5 text-sm bg-white border border-slate-200 rounded-[10px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ink)]"
              />
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-10 px-3 text-xs font-medium bg-white border border-slate-200 rounded-[10px] text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-ink)]"
                aria-label="Filter by priority"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 px-3 text-xs font-medium bg-white border border-slate-200 rounded-[10px] text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-ink)]"
                aria-label="Filter by category"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Due Date Filter */}
              <select
                value={dueFilter}
                onChange={(e) => setDueFilter(e.target.value)}
                className="h-10 px-3 text-xs font-medium bg-white border border-slate-200 rounded-[10px] text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-ink)]"
                aria-label="Filter by due date"
              >
                <option value="all">All Dates</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due Today</option>
                <option value="this_week">Due This Week</option>
                <option value="no_date">No Date</option>
              </select>
            </div>
          </div>

          {/* Task Cards or States */}
          {loading ? (
            <div className="space-y-3">
              <Skeleton height={88} />
              <Skeleton height={88} />
              <Skeleton height={88} />
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-[16px] text-center">
              <p className="text-sm text-red-700 font-medium mb-2">{error}</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title={
                searchQuery || priorityFilter !== 'all' || categoryFilter !== 'all' || dueFilter !== 'all'
                  ? 'No matching tasks found'
                  : activeTab === 'completed'
                  ? 'No completed tasks yet'
                  : 'No tasks scheduled'
              }
              description={
                searchQuery || priorityFilter !== 'all' || categoryFilter !== 'all' || dueFilter !== 'all'
                  ? 'Try resetting your search query or filters to find what you are looking for.'
                  : activeTab === 'completed'
                  ? 'Completed tasks will be recorded here.'
                  : `Add your first ${workspace === 'personal' ? 'personal' : 'work'} task to get started.`
              }
              actionLabel={activeTab === 'pending' && !searchQuery ? 'Add your first task' : undefined}
              onAction={activeTab === 'pending' && !searchQuery ? handleCreateNew : undefined}
            />
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} todayStr={todayStr} onEdit={handleEdit} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create / Edit Dialog */}
      <TaskFormDialog
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        workspace={workspace}
        initialTask={editingTask}
      />
    </div>
  );
};
