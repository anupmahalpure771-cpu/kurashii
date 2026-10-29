import React from 'react';
import { useTasks } from './hooks';
import { TaskList } from './components/TaskList';

export const PersonalTasksPage: React.FC = () => {
  const { tasks, loading, error, todayStr } = useTasks('personal');

  return (
    <TaskList
      tasks={tasks}
      loading={loading}
      error={error}
      workspace="personal"
      todayStr={todayStr}
    />
  );
};
