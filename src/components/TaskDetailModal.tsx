import { Calendar, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { evaluateClientDeadline, formatReadableDate } from '../lib/deadline';
import type { Task, TaskStatus } from '../types/task';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onUpdateProgress: (task: Task, progress: number, status?: TaskStatus) => Promise<void>;
}

export function TaskDetailModal({
  task,
  onClose,
  onEdit,
  onDelete,
  onUpdateProgress,
}: TaskDetailModalProps) {
  const [progress, setProgress] = useState(task.progress);
  const [saving, setSaving] = useState(false);

  const deadline = evaluateClientDeadline(task.dueDate, task.dueTime, task.status);

  const handleSaveProgress = async (nextProgress: number, nextStatus?: TaskStatus) => {
    setSaving(true);
    try {
      await onUpdateProgress(task, nextProgress, nextStatus);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {task.category} · {task.priority} Priority
            </div>
            <h2
              id="task-detail-title"
              className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              {task.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {formatReadableDate(task.dueDate)} at {task.dueTime}
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={
                deadline.isOverdue
                  ? 'text-red-600 dark:text-red-400 font-medium'
                  : deadline.isDueToday || deadline.isApproaching
                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                  : 'text-slate-600 dark:text-slate-300'
              }
            >
              {deadline.label}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              Status: {task.status}
            </span>
          </div>

          <div>
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Description
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {task.description || 'No description provided.'}
            </p>
          </div>

          {task.tags.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Tags
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {task.tags.map((tag) => `#${tag}`).join(' · ')}
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="detail-progress"
                className="text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Update Progress
              </label>
              <span className="font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {progress}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="detail-progress"
                type="range"
                min={0}
                max={100}
                step={5}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="flex-1 accent-blue-600 cursor-pointer"
              />
              <button
                type="button"
                disabled={saving || progress === task.progress}
                onClick={() =>
                  handleSaveProgress(
                    progress,
                    progress === 100
                      ? 'Completed'
                      : progress === 0
                      ? 'Pending'
                      : 'In Progress'
                  )
                }
                className="px-3.5 py-2 min-h-[38px] rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-medium text-white transition-colors whitespace-nowrap"
              >
                {saving ? 'Updating...' : 'Save Progress'}
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-400 dark:text-slate-500 font-mono tabular-nums">
            Created {new Date(task.createdAt).toLocaleString()} · Updated{' '}
            {new Date(task.updatedAt).toLocaleString()}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onDelete(task)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border border-red-200 dark:border-red-900/60 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit Task</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
