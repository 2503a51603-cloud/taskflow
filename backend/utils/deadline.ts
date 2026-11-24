import type { TaskStatus } from '../models/Task.ts';

export interface DeadlineInfo {
  dateKey: string;
  deadlineMs: number;
  isDueToday: boolean;
  isOverdue: boolean;
  isApproaching: boolean;
  hoursRemaining: number;
}

export function toDateKey(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildDeadlineTimestamp(
  dueDate: Date | string,
  dueTime: string
): number {
  const dateKey = toDateKey(dueDate);
  if (!dateKey) {
    return 0;
  }
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(dueTime || '23:59');
  const hours = match ? Number(match[1]) : 23;
  const minutes = match ? Number(match[2]) : 59;
  const [y, m, d] = dateKey.split('-').map(Number);
  return Date.UTC(y, m - 1, d, hours, minutes, 59, 999);
}

export function getReferenceNow(
  clientDate?: string,
  clientTime?: string
): { todayKey: string; nowMs: number } {
  const now = new Date();
  const validDate =
    typeof clientDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(clientDate)
      ? clientDate
      : toDateKey(now);
  const validTime =
    typeof clientTime === 'string' &&
    /^([01]\d|2[0-3]):([0-5]\d)$/.test(clientTime)
      ? clientTime
      : `${String(now.getUTCHours()).padStart(2, '0')}:${String(
          now.getUTCMinutes()
        ).padStart(2, '0')}`;

  const [y, m, d] = validDate.split('-').map(Number);
  const [hh, mm] = validTime.split(':').map(Number);

  return {
    todayKey: validDate,
    nowMs: Date.UTC(y, m - 1, d, hh, mm, 0, 0),
  };
}

export function evaluateDeadline(
  dueDate: Date | string,
  dueTime: string,
  status: TaskStatus,
  todayKey: string,
  nowMs: number
): DeadlineInfo {
  const dateKey = toDateKey(dueDate);
  const deadlineMs = buildDeadlineTimestamp(dueDate, dueTime);
  const diffMs = deadlineMs - nowMs;
  const hoursRemaining = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

  const isCompleted = status === 'Completed';
  const isDueToday = dateKey === todayKey;
  const isOverdue = !isCompleted && deadlineMs < nowMs;
  const isApproaching =
    !isCompleted && !isOverdue && diffMs >= 0 && diffMs <= 48 * 60 * 60 * 1000;

  return {
    dateKey,
    deadlineMs,
    isDueToday,
    isOverdue,
    isApproaching,
    hoursRemaining,
  };
}
