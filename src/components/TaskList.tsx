import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { evaluateClientDeadline, formatReadableDate } from '../lib/deadline';
import type { Task, TaskPriority, TaskStatus } from '../types/task';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onCycleStatus: (task: Task) => void;
  onCreateTask: () => void;
  onLoadSamples?: () => void;
}

function PriorityLabel({ priority }: { priority: TaskPriority }) {
  if (priority === 'High') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
        <ArrowUp className="h-3.5 w-3.5 shrink-0" />
        <span>High</span>
      </span>
    );
  }
  if (priority === 'Medium') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
        <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        <span>Medium</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
      <ArrowDown className="h-3.5 w-3.5 shrink-0" />
      <span>Low</span>
    </span>
  );
}

function StatusButton({
  status,
  onClick,
}: {
  status: TaskStatus;
  onClick: () => void;
}) {
  if (status === 'Completed') {
    return (
      <button
        type="button"
        onClick={onClick}
        title="Click to cycle status"
        className="inline-flex items-center gap-1.5 min-h-[32px] text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap"
      >
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span>Completed</span>
      </button>
    );
  }
  if (status === 'In Progress') {
    return (
      <button
        type="button"
        onClick={onClick}
        title="Click to cycle status"
        className="inline-flex items-center gap-1.5 min-h-[32px] text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
      >
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span>In Progress</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title="Click to cycle status"
      className="inline-flex items-center gap-1.5 min-h-[32px] text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline whitespace-nowrap"
    >
      <Circle className="h-3.5 w-3.5 shrink-0" />
      <span>Pending</span>
    </button>
  );
}

export function TaskList({
  tasks,
  loading,
  onViewTask,
  onEditTask,
  onDeleteTask,
  onCycleStatus,
  onCreateTask,
  onLoadSamples,
}: TaskListProps) {
  if (loading && tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          No tasks found
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          There are no tasks matching your current view or filters. Create a new
          task to start tracking deadlines and progress.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onCreateTask}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
          {onLoadSamples && (
            <button
              type="button"
              onClick={onLoadSamples}
              className="inline-flex items-center px-4 py-2 min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Load Sample Tasks
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      {/* Desktop & Tablet Data Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-xs font-medium text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">Task</th>
              <th className="py-3 px-4 whitespace-nowrap">Deadline</th>
              <th className="py-3 px-4 whitespace-nowrap">Priority</th>
              <th className="py-3 px-4 whitespace-nowrap">Status</th>
              <th className="py-3 px-4 whitespace-nowrap">Progress</th>
              <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            {tasks.map((task) => {
              const deadline = evaluateClientDeadline(
                task.dueDate,
                task.dueTime,
                task.status
              );
              return (
                <tr
                  key={task._id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 max-w-md">
                    <button
                      type="button"
                      onClick={() => onViewTask(task)}
                      className="text-left group focus-visible:outline-2 focus-visible:outline-blue-600 rounded block w-full"
                    >
                      <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                        {task.title}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>{task.category}</span>
                        {task.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="inline-flex items-center gap-1.5">
                            <span aria-hidden="true">·</span>
                            <span>#{tag}</span>
                          </span>
                        ))}
                        {task.tags.length > 3 && (
                          <span className="inline-flex items-center gap-1.5">
                            <span aria-hidden="true">·</span>
                            <span>+{task.tags.length - 3}</span>
                          </span>
                        )}
                      </div>
                    </button>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-mono text-xs tabular-nums text-slate-800 dark:text-slate-200">
                      {formatReadableDate(task.dueDate)} · {task.dueTime}
                    </div>
                    <div
                      className={`mt-0.5 inline-flex items-center gap-1 text-xs ${
                        deadline.isOverdue
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : deadline.isDueToday || deadline.isApproaching
                          ? 'text-amber-600 dark:text-amber-400 font-medium'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {deadline.isOverdue && (
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                      )}
                      <span>{deadline.label}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <PriorityLabel priority={task.priority} />
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusButton
                      status={task.status}
                      onClick={() => onCycleStatus(task)}
                    />
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap min-w-[140px]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            task.progress === 100
                              ? 'bg-emerald-600'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300 w-9 text-right">
                        {task.progress}%
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onViewTask(task)}
                        title="View task details"
                        aria-label={`View ${task.title}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        title="Edit task"
                        aria-label={`Edit ${task.title}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTask(task)}
                        title="Delete task"
                        aria-label={`Delete ${task.title}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
        {tasks.map((task) => {
          const deadline = evaluateClientDeadline(
            task.dueDate,
            task.dueTime,
            task.status
          );
          return (
            <div key={task._id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onViewTask(task)}
                  className="text-left min-w-0 flex-1"
                >
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {task.title}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {task.category}
                    {task.tags.length > 0 && ` · ${task.tags.map((t) => `#${t}`).join(' · ')}`}
                  </div>
                </button>
                <PriorityLabel priority={task.priority} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span
                  className={`font-mono tabular-nums ${
                    deadline.isOverdue
                      ? 'text-red-600 dark:text-red-400 font-medium'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {formatReadableDate(task.dueDate)} · {task.dueTime} ({deadline.label})
                </span>
                <StatusButton
                  status={task.status}
                  onClick={() => onCycleStatus(task)}
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      task.progress === 100 ? 'bg-emerald-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <span className="font-mono text-xs tabular-nums text-slate-700 dark:text-slate-300">
                  {task.progress}%
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onViewTask(task)}
                  className="px-3 py-2 min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200"
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => onEditTask(task)}
                  className="px-3 py-2 min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTask(task)}
                  className="px-3 py-2 min-h-[40px] rounded-lg border border-red-200 dark:border-red-900/60 text-xs font-medium text-red-600 dark:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
