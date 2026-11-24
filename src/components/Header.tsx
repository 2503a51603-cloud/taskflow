import { Menu, Plus } from 'lucide-react';
import type { NavView } from './Sidebar';

interface HeaderProps {
  activeView: NavView;
  onOpenMobileNav: () => void;
  onCreateTask: () => void;
}

const VIEW_LABELS: Record<NavView, string> = {
  dashboard: 'Dashboard Overview',
  tasks: 'All Tasks',
  today: "Today's Focus",
  alerts: 'Deadline Alerts',
  setup: 'MongoDB Atlas Setup',
};

export function Header({
  activeView,
  onOpenMobileNav,
  onCreateTask,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-slate-500 dark:text-slate-400 hidden sm:inline whitespace-nowrap">
            Student Planner
          </span>
          <span
            className="text-slate-300 dark:text-slate-600 hidden sm:inline"
            aria-hidden="true"
          >
            /
          </span>
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
            {VIEW_LABELS[activeView]}
          </h1>
        </div>
      </div>

      <button
        type="button"
        onClick={onCreateTask}
        className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <Plus className="h-4 w-4 shrink-0" />
        <span>New Task</span>
      </button>
    </header>
  );
}
