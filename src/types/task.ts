export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Task {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: TaskPriority;
  category: string;
  tags: string[];
  status: TaskStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFormPayload {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: TaskPriority;
  category: string;
  tags: string[];
  status: TaskStatus;
  progress: number;
}

export interface TaskStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  todayTasks: number;
  todayRemainingTasks: number;
  approachingTasks: number;
  completionRate: number;
  averageProgress: number;
  priorityDistribution: Record<TaskPriority, number>;
  statusDistribution: Record<TaskStatus, number>;
  categoryDistribution: Array<{
    category: string;
    total: number;
    completed: number;
  }>;
  weeklySchedule: Array<{
    dateKey: string;
    label: string;
    due: number;
    completed: number;
  }>;
  categories: string[];
  tags: string[];
}

export interface HealthResponse {
  success: boolean;
  service: string;
  storageMode?: 'mongodb' | 'json';
  jsonTaskCount?: number;
  database: {
    connected: boolean;
    configured: boolean;
    placeholderDetected?: boolean;
    state: string;
    dbName: string | null;
    error: string | null;
  };
}

export interface TaskFilters {
  search: string;
  status: 'All' | TaskStatus;
  priority: 'All' | TaskPriority;
  category: string;
  tag: string;
  dueDate: string;
  timeframe: 'all' | 'today' | 'overdue' | 'upcoming';
  sortBy: 'dueDate' | 'priority' | 'progress' | 'createdAt';
  order: 'asc' | 'desc';
}
