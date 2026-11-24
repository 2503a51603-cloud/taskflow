import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import type { TaskStats } from '../types/task';

interface SummaryCardsProps {
  stats: TaskStats | null;
  loading: boolean;
  onQuickFilter: (filter: 'all' | 'pending' | 'completed' | 'overdue' | 'today') => void;
}

export function SummaryCards({
  stats,
  loading,
  onQuickFilter,
}: SummaryCardsProps) {
  if (loading && !stats) {
    return (
      <section
        aria-label="Task summary metrics"
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4"
      >
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 animate-pulse"
          >
            <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
            <div className="h-7 w-12 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
            <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800/70 rounded" />
          </div>
        ))}
      </section>
    );
  }

  const total = stats?.totalTasks ?? 0;
  const pending = (stats?.pendingTasks ?? 0) + (stats?.inProgressTasks ?? 0);
  const completed = stats?.completedTasks ?? 0;
  const overdue = stats?.overdueTasks ?? 0;
  const today = stats?.todayTasks ?? 0;

  const cards = [
    {
      id: 'all' as const,
      label: 'Total Tasks',
      value: total,
      detail: `${stats?.averageProgress ?? 0}% avg progress`,
      icon: Layers,
      tone: 'text-slate-700 dark:text-slate-300',
    },
    {
      id: 'pending' as const,
      label: 'Pending & Active',
      value: pending,
      detail: `${stats?.inProgressTasks ?? 0} in progress`,
      icon: Clock,
      tone: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'completed' as const,
      label: 'Completed',
      value: completed,
      detail: `${stats?.completionRate ?? 0}% completion rate`,
      icon: CheckCircle2,
      tone: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'overdue' as const,
      label: 'Overdue',
      value: overdue,
      detail: overdue > 0 ? 'Needs immediate action' : 'All deadlines on track',
      icon: AlertCircle,
      tone:
        overdue > 0
          ? 'text-red-600 dark:text-red-400'
          : 'text-slate-500 dark:text-slate-400',
    },
    {
      id: 'today' as const,
      label: "Today's Tasks",
      value: today,
      detail: `${stats?.todayRemainingTasks ?? 0} remaining today`,
      icon: CalendarCheck,
      tone: 'text-blue-600 dark:text-blue-400',
    },
  ];

  return (
    <section
      aria-label="Task summary metrics"
      className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onQuickFilter(card.id)}
            className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-4 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                {card.label}
              </span>
              <Icon className={`h-4 w-4 shrink-0 ${card.tone}`} />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {card.value}
            </div>
            <div
              className={`mt-1 text-xs truncate ${
                card.id === 'overdue' && overdue > 0
                  ? 'text-red-600 dark:text-red-400 font-medium'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {card.detail}
            </div>
          </button>
        );
      })}
    </section>
  );
}
