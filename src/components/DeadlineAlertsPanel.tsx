import { AlertTriangle, Bell, BellRing, Check, Clock } from 'lucide-react';
import { useState } from 'react';
import { evaluateClientDeadline, formatReadableDate } from '../lib/deadline';
import type { Task } from '../types/task';

interface DeadlineAlertsPanelProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onMarkComplete: (task: Task) => void;
  compact?: boolean;
}

export function DeadlineAlertsPanel({
  tasks,
  onSelectTask,
  onMarkComplete,
  compact = false,
}: DeadlineAlertsPanelProps) {
  const [notifPermission, setNotifPermission] = useState<string>(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  );
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);

  const flagged = tasks
    .map((task) => ({
      task,
      deadline: evaluateClientDeadline(task.dueDate, task.dueTime, task.status),
    }))
    .filter(
      ({ task, deadline }) =>
        task.status !== 'Completed' &&
        (deadline.isOverdue || deadline.isDueToday || deadline.isApproaching)
    )
    .sort((a, b) => a.deadline.hoursRemaining - b.deadline.hoursRemaining);

  const overdueList = flagged.filter((item) => item.deadline.isOverdue);
  const dueSoonList = flagged.filter((item) => !item.deadline.isOverdue);

  const handleEnableNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifFeedback('Browser notifications are not supported in this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);

      if (permission === 'granted') {
        const urgentCount = overdueList.length + dueSoonList.length;
        new Notification('TaskFlow Deadline Reminder', {
          body:
            urgentCount > 0
              ? `You have ${overdueList.length} overdue and ${dueSoonList.length} upcoming task(s) needing attention.`
              : 'All current deadlines are under control.',
        });
        setNotifFeedback(
          'Browser alerts enabled while this application tab remains open.'
        );
      } else {
        setNotifFeedback('Notification permission was declined by the browser.');
      }
    } catch {
      setNotifFeedback('Unable to request browser notification permission.');
    }
  };

  const displayedItems = compact ? flagged.slice(0, 5) : flagged;

  return (
    <section
      aria-label="Deadline alerts and reminders"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Deadline Alerts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {overdueList.length} overdue · {dueSoonList.length} due today or within
            48 hours
          </p>
        </div>

        {notifPermission !== 'unsupported' && (
          <button
            type="button"
            onClick={handleEnableNotifications}
            className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            {notifPermission === 'granted' ? (
              <BellRing className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Bell className="h-3.5 w-3.5" />
            )}
            <span>
              {notifPermission === 'granted'
                ? 'Send Desktop Reminder'
                : 'Enable Browser Alerts'}
            </span>
          </button>
        )}
      </div>

      {notifFeedback && (
        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
          {notifFeedback}
        </p>
      )}

      {displayedItems.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No overdue or approaching deadlines right now.
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800 mt-1">
          {displayedItems.map(({ task, deadline }) => (
            <div
              key={task._id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <button
                type="button"
                onClick={() => onSelectTask(task)}
                className="text-left min-w-0 flex-1 group focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
              >
                <div className="flex items-center gap-2">
                  {deadline.isOverdue ? (
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                    {task.title}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pl-6">
                  <span
                    className={
                      deadline.isOverdue
                        ? 'text-red-600 dark:text-red-400 font-medium'
                        : 'text-amber-600 dark:text-amber-400 font-medium'
                    }
                  >
                    {deadline.label}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {formatReadableDate(task.dueDate)} at {task.dueTime}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{task.priority} Priority</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{task.progress}%</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onMarkComplete(task)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Mark Done</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
