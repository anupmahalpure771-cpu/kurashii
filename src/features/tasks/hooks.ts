import { useTasksContext } from './TasksProvider';
import { WorkspaceType } from '../../types/models';

export function useTasks(_workspace?: WorkspaceType) {
  return useTasksContext();
}
