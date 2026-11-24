import type { TaskStatus } from '../types/task';

export interface ClientDeadlineInfo {
  dateKey: string;
  isDueToday: boolean;
  isOverdue: boolean;
  isApproaching: boolean;
  hoursRemaining: number;
  label: string;
}

export function getLocalDateAndTime(): { clientDate: string; clientTime: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return {
    clientDate: `${year}-${month}-${day}`,
    clientTime: `${hours}:${minutes}`,
  };
}

export function extractDateKey(isoDate: string): string {
  if (!isoDate) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function evaluateClientDeadline(
  dueDate: string,
  dueTime: string,
  status: TaskStatus
): ClientDeadlineInfo {
  const dateKey = extractDateKey(dueDate);
  if (!dateKey) {
    return {
      dateKey: '',
      isDueToday: false,
      isOverdue: false,
      isApproaching: false,
      hoursRemaining: 0,
      label: 'No date',
    };
  }

  const { clientDate } = getLocalDateAndTime();
  const [y, m, d] = dateKey.split('-').map(Number);
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(dueTime || '23:59');
  const hh = match ? Number(match[1]) : 23;
  const mm = match ? Number(match[2]) : 59;

  const deadlineDate = new Date(y, m - 1, d, hh, mm, 59, 999);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const hoursRemaining = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

  const isCompleted = status === 'Completed';
  const isDueToday = dateKey === clientDate;
  const isOverdue = !isCompleted && diffMs < 0;
  const isApproaching =
    !isCompleted && !isOverdue && diffMs >= 0 && diffMs <= 48 * 60 * 60 * 1000;

  let label = 'Scheduled';
  if (isCompleted) {
    label = 'Completed';
  } else if (isOverdue) {
    const overdueHours = Math.abs(hoursRemaining);
    if (overdueHours < 24) {
      label = `Overdue by ${Math.max(1, Math.round(overdueHours))}h`;
    } else {
      label = `Overdue by ${Math.round(overdueHours / 24)}d`;
    }
  } else if (isDueToday) {
    label = `Due today at ${dueTime || '23:59'}`;
  } else if (isApproaching) {
    label = `Due in ${Math.max(1, Math.round(hoursRemaining))}h`;
  } else {
    const days = Math.ceil(hoursRemaining / 24);
    label = `In ${days}d`;
  }

  return {
    dateKey,
    isDueToday,
    isOverdue,
    isApproaching,
    hoursRemaining,
    label,
  };
}

export function formatReadableDate(isoDate: string): string {
  const key = extractDateKey(isoDate);
  if (!key) return '—';
  const [y, m, d] = key.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
