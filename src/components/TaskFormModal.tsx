import { X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { extractDateKey, getLocalDateAndTime } from '../lib/deadline';
import type {
  Task,
  TaskFormPayload,
  TaskPriority,
  TaskStatus,
} from '../types/task';

interface TaskFormModalProps {
  initialTask: Task | null;
  onClose: () => void;
  onSubmit: (payload: TaskFormPayload) => Promise<void>;
}

const CATEGORY_PRESETS = [
  'Coursework',
  'Assignments',
  'Exam Prep',
  'Projects',
  'Lab Work',
  'Personal',
];

export function TaskFormModal({
  initialTask,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const { clientDate } = getLocalDateAndTime();

  const [title, setTitle] = useState(initialTask?.title ?? '');
  const [description, setDescription] = useState(initialTask?.description ?? '');
  const [dueDate, setDueDate] = useState(
    initialTask ? extractDateKey(initialTask.dueDate) : clientDate
  );
  const [dueTime, setDueTime] = useState(initialTask?.dueTime ?? '23:59');
  const [priority, setPriority] = useState<TaskPriority>(
    initialTask?.priority ?? 'Medium'
  );
  const [category, setCategory] = useState(initialTask?.category ?? 'Coursework');
  const [tagsInput, setTagsInput] = useState(
    initialTask ? initialTask.tags.join(', ') : ''
  );
  const [status, setStatus] = useState<TaskStatus>(
    initialTask?.status ?? 'Pending'
  );
  const [progress, setProgress] = useState<number>(initialTask?.progress ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = (nextStatus: TaskStatus) => {
    setStatus(nextStatus);
    if (nextStatus === 'Completed') {
      setProgress(100);
    } else if (nextStatus === 'Pending') {
      setProgress(0);
    } else if (nextStatus === 'In Progress' && (progress === 0 || progress === 100)) {
      setProgress(25);
    }
  };

  const handleProgressChange = (nextVal: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(nextVal)));
    setProgress(clamped);
    if (clamped === 100) {
      setStatus('Completed');
    } else if (clamped === 0) {
      setStatus('Pending');
    } else {
      setStatus('In Progress');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 2) {
      setError('Please enter a task title (at least 2 characters).');
      return;
    }
    if (!dueDate) {
      setError('Please select a due date.');
      return;
    }

    const tags = Array.from(
      new Set(
        tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      )
    ).slice(0, 10);

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        dueDate,
        dueTime: dueTime || '23:59',
        priority,
        category: category.trim() || 'Coursework',
        tags,
        status,
        progress,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save task. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-form-title"
    >
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2
            id="task-form-title"
            className="text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            {initialTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-medium text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="task-title"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Task Title *
            </label>
            <input
              id="task-title"
              type="text"
              required
              maxLength={140}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Submit DBMS Normalization Lab Report"
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Description
            </label>
            <textarea
              id="task-description"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add assignment requirements, chapters to revise, or submission notes..."
              className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-due-date"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Due Date *
              </label>
              <input
                id="task-due-date"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="task-due-time"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Due Time
              </label>
              <input
                id="task-due-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="task-priority"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="task-category"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Category
              </label>
              <input
                id="task-category"
                list="category-presets"
                maxLength={50}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Coursework, Projects..."
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <datalist id="category-presets">
                {CATEGORY_PRESETS.map((preset) => (
                  <option key={preset} value={preset} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label
              htmlFor="task-tags"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Tags (comma separated)
            </label>
            <input
              id="task-tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g., DBMS, Lab, Exam"
              className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label
                htmlFor="task-status"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Pending">Pending (0%)</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed (100%)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="task-progress-range"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Progress
                </label>
                <span className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                  {progress}%
                </span>
              </div>
              <div className="flex items-center gap-3 h-10">
                <input
                  id="task-progress-range"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={progress}
                  onChange={(e) => handleProgressChange(Number(e.target.value))}
                  className="flex-1 accent-blue-600 cursor-pointer"
                />
                <input
                  type="number"
                  aria-label="Progress percentage"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => handleProgressChange(Number(e.target.value))}
                  className="w-16 h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono tabular-nums text-center text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 min-h-[40px] rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-sm font-medium text-white transition-colors"
            >
              {submitting
                ? 'Saving...'
                : initialTask
                ? 'Save Changes'
                : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
