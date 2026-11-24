import {
  AlertTriangle,
  CalendarClock,
  Database,
  LayoutDashboard,
  ListTodo,
  Moon,
  Sun,
  X,
} from 'lucide-react';

export type NavView = 'dashboard' | 'tasks' | 'today' | 'alerts' | 'setup';

interface SidebarProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
  alertCount: number;
  todayCount: number;
  dbConnected: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeView,
  onNavigate,
  alertCount,
  todayCount,
  dbConnected,
  darkMode,
  onToggleDarkMode,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navItems: Array<{
    id: NavView;
    label: string;
    icon: typeof LayoutDashboard;
    count?: number;
    urgent?: boolean;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'All Tasks', icon: ListTodo },
    {
      id: 'today',
      label: "Today's Focus",
      icon: CalendarClock,
      count: todayCount,
    },
    {
      id: 'alerts',
      label: 'Deadline Alerts',
      icon: AlertTriangle,
      count: alertCount,
      urgent: alertCount > 0,
    },
    { id: 'setup', label: 'MongoDB Setup', icon: Database },
  ];

  const handleSelect = (id: NavView) => {
    onNavigate(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div>
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleSelect('dashboard')}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
          >
            TaskFlow
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1" aria-label="Primary Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 min-h-[42px] rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span
                    className={`font-mono text-xs tabular-nums shrink-0 ${
                      isActive
                        ? 'text-blue-100'
                        : item.urgent
                        ? 'text-red-600 dark:text-red-400 font-semibold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <button
          type="button"
          onClick={() => handleSelect('setup')}
          className="w-full flex items-center justify-between px-3 py-2 min-h-[40px] rounded-lg text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 shrink-0" />
            <span>Storage</span>
          </span>
          <span
            className={`font-medium ${
              dbConnected
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}
          >
            {dbConnected ? 'MongoDB Atlas' : 'JSON Store'}
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleDarkMode}
          className="w-full flex items-center justify-between px-3 py-2 min-h-[40px] rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            {darkMode ? (
              <Sun className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Moon className="h-3.5 w-3.5 shrink-0" />
            )}
            <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
          </span>
          <span className="text-slate-400 dark:text-slate-500">
            {darkMode ? 'On' : 'Off'}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-64 max-w-[80vw] h-full">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
