import type {
  HealthResponse,
  Task,
  TaskFilters,
  TaskFormPayload,
  TaskStats,
} from '../types/task';
import { getLocalDateAndTime } from './deadline';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (json && typeof json.message === 'string' && json.message) ||
      `Request failed with status ${res.status}`;
    const code = json && typeof json.code === 'string' ? json.code : undefined;
    throw new ApiError(message, res.status, code);
  }
  return json as T;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/health');
  const json = await res.json().catch(() => null);
  if (!json || typeof json !== 'object' || !('database' in json)) {
    throw new ApiError(
      `Backend returned an unexpected response (HTTP ${res.status}).`,
      res.status
    );
  }
  return json as HealthResponse;
}

export async function fetchTasks(filters: Partial<TaskFilters> = {}): Promise<Task[]> {
  const params = new URLSearchParams();
  const { clientDate, clientTime } = getLocalDateAndTime();
  params.set('clientDate', clientDate);
  params.set('clientTime', clientTime);

  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.status && filters.status !== 'All') params.set('status', filters.status);
  if (filters.priority && filters.priority !== 'All')
    params.set('priority', filters.priority);
  if (filters.category && filters.category !== 'All')
    params.set('category', filters.category);
  if (filters.tag && filters.tag !== 'All') params.set('tag', filters.tag);
  if (filters.dueDate) params.set('dueDate', filters.dueDate);
  if (filters.timeframe && filters.timeframe !== 'all')
    params.set('timeframe', filters.timeframe);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.order) params.set('order', filters.order);

  const res = await fetch(`/api/tasks?${params.toString()}`);
  const data = await parseResponse<{ success: boolean; data: Task[] }>(res);
  return data.data;
}

export async function fetchTaskStats(): Promise<TaskStats> {
  const { clientDate, clientTime } = getLocalDateAndTime();
  const params = new URLSearchParams({ clientDate, clientTime });
  const res = await fetch(`/api/tasks/stats?${params.toString()}`);
  const data = await parseResponse<{ success: boolean; data: TaskStats }>(res);
  return data.data;
}

export async function createTask(payload: TaskFormPayload): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<{ success: boolean; data: Task }>(res);
  return data.data;
}

export async function updateTask(
  id: string,
  payload: Partial<TaskFormPayload>
): Promise<Task> {
  const res = await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse<{ success: boolean; data: Task }>(res);
  return data.data;
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  await parseResponse<{ success: boolean }>(res);
}

export async function seedSampleTasks(): Promise<{
  inserted: number;
  existing: number;
  storageMode: 'mongodb' | 'json';
}> {
  const res = await fetch('/api/tasks/seed', {
    method: 'POST',
  });
  const data = await parseResponse<{
    success: boolean;
    data: { inserted: number; existing: number; storageMode: 'mongodb' | 'json' };
  }>(res);
  return data.data;
}

export async function syncJsonTasks(): Promise<{
  migrated: number;
  skipped: number;
}> {
  const res = await fetch('/api/tasks/sync-json', {
    method: 'POST',
  });
  const data = await parseResponse<{
    success: boolean;
    data: { migrated: number; skipped: number };
  }>(res);
  return data.data;
}
