import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  onSnapshot,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { TaskItem, TaskStatus, WorkspaceType } from '../../types/models';

const taskConverter: FirestoreDataConverter<TaskItem> = {
  toFirestore(task: TaskItem) {
    return {
      workspace: task.workspace,
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate || null,
      status: task.status,
      stage: task.stage || (task.status === 'completed' ? 'done' : 'todo'),
      subtasks: task.subtasks || [],
      recurrence: task.recurrence || 'none',
      completedAt: task.completedAt || null,
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): TaskItem {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      workspace: data.workspace,
      title: data.title || '',
      description: data.description || '',
      priority: data.priority || 'medium',
      category: data.category || 'Other',
      dueDate: data.dueDate || null,
      status: data.status || 'pending',
      stage: data.stage || (data.status === 'completed' ? 'done' : 'todo'),
      subtasks: data.subtasks || [],
      recurrence: data.recurrence || 'none',
      completedAt: data.completedAt || null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};

export const DEMO_UID = 'demo-user-123';

const DEMO_TASKS_KEY = 'kurashii_demo_tasks';
const DEMO_EVENT = 'kurashii_demo_tasks_changed';

function getDemoSeedTasks(): TaskItem[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const overdueDate = new Date(now.getTime() - 86400000 * 2);
  const overdueStr = overdueDate.toISOString().split('T')[0];
  const tomorrowDate = new Date(now.getTime() + 86400000);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];
  const nextWeekDate = new Date(now.getTime() + 86400000 * 4);
  const nextWeekStr = nextWeekDate.toISOString().split('T')[0];

  return [
    {
      id: 'demo-p-1',
      workspace: 'personal',
      title: 'Morning 30-min stretch & meditation',
      description: 'Mindful breathing and full-body stretch to start the day',
      priority: 'medium',
      category: 'Health',
      dueDate: todayStr,
      status: 'pending',
      completedAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'demo-p-2',
      workspace: 'personal',
      title: 'Weekly fresh grocery restock',
      description: 'Fresh vegetables, sourdough bread, oat milk and fruit',
      priority: 'medium',
      category: 'Home',
      dueDate: todayStr,
      status: 'pending',
      completedAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'demo-p-3',
      workspace: 'personal',
      title: 'Pay quarterly home maintenance invoice',
      description: 'Society maintenance charges due before cycle ends',
      priority: 'high',
      category: 'Finance',
      dueDate: overdueStr,
      status: 'pending',
      completedAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'demo-p-4',
      workspace: 'personal',
      title: 'Read 20 pages of current book',
      description: 'Focus and productivity chapter',
      priority: 'low',
      category: 'Learning',
      dueDate: nextWeekStr,
      status: 'completed',
      completedAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'demo-w-1',
      workspace: 'professional',
      title: 'Prepare Q4 product roadmap presentation',
      description: 'Finalize slides and sprint velocity metrics for executive team',
      priority: 'high',
      category: 'Project',
      dueDate: todayStr,
      status: 'pending',
      completedAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'demo-w-2',
      workspace: 'professional',
      title: 'Client onboarding check-in call',
      description: 'Walk through kickoff milestones, team roles, and initial deliverables',
      priority: 'high',
      category: 'Client',
      dueDate: tomorrowStr,
      status: 'pending',
      completedAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'demo-w-3',
      workspace: 'professional',
      title: 'Submit travel expense reimbursement',
      description: 'Attach receipts from client summit and verify total minor units',
      priority: 'medium',
      category: 'Admin',
      dueDate: overdueStr,
      status: 'pending',
      completedAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'demo-w-4',
      workspace: 'professional',
      title: 'Review pull request for auth isolation',
      description: 'Double check strict workspace rule enforcement and unit tests',
      priority: 'low',
      category: 'Project',
      dueDate: nextWeekStr,
      status: 'completed',
      completedAt: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];
}

function getStoredDemoTasks(): TaskItem[] {
  try {
    const raw = localStorage.getItem(DEMO_TASKS_KEY);
    if (!raw) {
      const seed = getDemoSeedTasks();
      localStorage.setItem(DEMO_TASKS_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return getDemoSeedTasks();
  }
}

function saveDemoTasks(tasks: TaskItem[]) {
  try {
    localStorage.setItem(DEMO_TASKS_KEY, JSON.stringify(tasks));
  } catch {
    // fallback
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DEMO_EVENT));
  }
}

export async function createTask(
  uid: string,
  data: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>
): Promise<string> {
  if (uid === DEMO_UID) {
    const tasks = getStoredDemoTasks();
    const id = 'demo-t-' + Date.now();
    const now = new Date().toISOString();
    const newTask: TaskItem = {
      ...data,
      id,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    tasks.unshift(newTask);
    saveDemoTasks(tasks);
    return id;
  }

  const path = `users/${uid}/tasks`;
  try {
    const colRef = collection(db, 'users', uid, 'tasks').withConverter(taskConverter);
    const now = new Date().toISOString();
    const docRef = await addDoc(colRef, {
      ...data,
      id: '',
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

export async function updateTask(
  uid: string,
  taskId: string,
  updates: Partial<Omit<TaskItem, 'id' | 'createdAt'>>
): Promise<void> {
  if (uid === DEMO_UID) {
    const tasks = getStoredDemoTasks();
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      tasks[idx] = {
        ...tasks[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveDemoTasks(tasks);
    }
    return;
  }

  const path = `users/${uid}/tasks/${taskId}`;
  try {
    const docRef = doc(db, 'users', uid, 'tasks', taskId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

export async function updateTaskStage(
  uid: string,
  taskId: string,
  stage: TaskItem['stage']
): Promise<void> {
  const isDone = stage === 'done';
  return updateTask(uid, taskId, {
    stage,
    status: isDone ? 'completed' : 'pending',
    completedAt: isDone ? new Date().toISOString() : null,
  });
}

export async function toggleTaskComplete(
  uid: string,
  taskId: string,
  currentStatus: TaskStatus
): Promise<void> {
  if (uid === DEMO_UID) {
    const tasks = getStoredDemoTasks();
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      const isCompleted = currentStatus === 'completed';
      const nextStatus: TaskStatus = isCompleted ? 'pending' : 'completed';
      tasks[idx] = {
        ...tasks[idx],
        status: nextStatus,
        completedAt: nextStatus === 'completed' ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      };
      saveDemoTasks(tasks);
    }
    return;
  }

  const path = `users/${uid}/tasks/${taskId}`;
  try {
    const isCompleted = currentStatus === 'completed';
    const nextStatus: TaskStatus = isCompleted ? 'pending' : 'completed';
    const docRef = doc(db, 'users', uid, 'tasks', taskId);
    await updateDoc(docRef, {
      status: nextStatus,
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}

export async function deleteTask(uid: string, taskId: string): Promise<void> {
  if (uid === DEMO_UID) {
    const tasks = getStoredDemoTasks();
    const filtered = tasks.filter((t) => t.id !== taskId);
    saveDemoTasks(filtered);
    return;
  }

  const path = `users/${uid}/tasks/${taskId}`;
  try {
    const docRef = doc(db, 'users', uid, 'tasks', taskId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

export function subscribeWorkspaceTasks(
  uid: string,
  workspace: WorkspaceType,
  onData: (tasks: TaskItem[]) => void,
  onError: (err: unknown) => void
): () => void {
  if (uid === DEMO_UID) {
    const emit = () => {
      const all = getStoredDemoTasks();
      const filtered = all.filter((t) => t.workspace === workspace);
      onData(filtered);
    };

    // Emit immediately
    emit();

    const listener = () => emit();
    if (typeof window !== 'undefined') {
      window.addEventListener(DEMO_EVENT, listener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(DEMO_EVENT, listener);
      }
    };
  }

  const path = `users/${uid}/tasks`;
  const q = query(
    collection(db, 'users', uid, 'tasks').withConverter(taskConverter),
    where('workspace', '==', workspace),
    limit(100)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: TaskItem[] = [];
      snapshot.forEach((d) => items.push(d.data()));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      onError(error);
    }
  );
}
