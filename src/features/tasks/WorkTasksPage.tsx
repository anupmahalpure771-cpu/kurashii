import React from 'react';
import { useTasks } from './hooks';
import { TaskList } from './components/TaskList';

export const WorkTasksPage: React.FC = () => {
  const { tasks, loading, error, todayStr } = useTasks('professional');

  return (
    <TaskList
      tasks={tasks}
      loading={loading}
      error={error}
      workspace="professional"
      todayStr={todayStr}
    />
  );
};
