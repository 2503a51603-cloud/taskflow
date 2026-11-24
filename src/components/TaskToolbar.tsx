import { RotateCcw, Search } from 'lucide-react';
import type { TaskFilters, TaskStatus } from '../types/task';

interface TaskToolbarProps {
  filters: TaskFilters;
  categories: string[];
  tags: string[];
  onChange: (next: TaskFilters) => void;
  onReset: () => void;
}

const STATUS_TABS: Array<'All' | TaskStatus> = [
  'All',
  'Pending',
  'In Progress',
  'Completed',
];

export function TaskToolbar({
  filters,
  categories,
  tags,
  onChange,
  onReset,
}: TaskToolbarProps) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'All' ||
    filters.priority !== 'All' ||
    filters.category !== 'All' ||
    filters.tag !== 'All' ||
    filters.dueDate !== '' ||
    filters.timeframe !== 'all';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search tasks by title, description, category, or tag..."
            aria-label="Search tasks"
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div
          className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0"
          role="group"
          aria-label="Filter by task status"
        >
          {STATUS_TABS.map((status) => {
            const active = filters.status === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => onChange({ ...filters, status })}
                className={`px-3 py-1.5 min-h-[32px] text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <select
          aria-label="Filter by priority"
          value={filters.priority}
          onChange={(e) =>
            onChange({
              ...filters,
              priority: e.target.value as TaskFilters['priority'],
            })
          }
          className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="All">All Priorities</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>

        <select
          aria-label="Filter by category"
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="All">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by tag"
          value={filters.tag}
          onChange={(e) => onChange({ ...filters, tag: e.target.value })}
          className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="All">All Tags</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              #{t}
            </option>
          ))}
        </select>

        <input
          type="date"
          aria-label="Filter by due date"
          value={filters.dueDate}
          onChange={(e) => onChange({ ...filters, dueDate: e.target.value })}
          className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />

        <div className="flex items-center gap-2">
          <select
            aria-label="Sort tasks"
            value={`${filters.sortBy}:${filters.order}`}
            onChange={(e) => {
              const [sortBy, order] = e.target.value.split(':') as [
                TaskFilters['sortBy'],
                TaskFilters['order'],
              ];
              onChange({ ...filters, sortBy, order });
            }}
            className="flex-1 h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="dueDate:asc">Deadline (Earliest)</option>
            <option value="dueDate:desc">Deadline (Latest)</option>
            <option value="priority:desc">Priority (High to Low)</option>
            <option value="priority:asc">Priority (Low to High)</option>
            <option value="progress:desc">Progress (High to Low)</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              title="Reset all filters"
              aria-label="Reset all filters"
              className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
