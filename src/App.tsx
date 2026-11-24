import { AlertTriangle, Database, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { DashboardCharts } from './components/DashboardCharts';
import { DeadlineAlertsPanel } from './components/DeadlineAlertsPanel';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Header } from './components/Header';
import { MongoSetupView } from './components/MongoSetupView';
import { Sidebar, type NavView } from './components/Sidebar';
import { SummaryCards } from './components/SummaryCards';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TaskFormModal } from './components/TaskFormModal';
import { TaskList } from './components/TaskList';
import { TaskToolbar } from './components/TaskToolbar';
import {
  ApiError,
  createTask,
  deleteTask,
  fetchHealth,
  fetchTasks,
  fetchTaskStats,
  seedSampleTasks,
  syncJsonTasks,
  updateTask,
} from './lib/api';
import { evaluateClientDeadline } from './lib/deadline';
import type {
  HealthResponse,
  Task,
  TaskFilters,
  TaskFormPayload,
  TaskStats,
  TaskStatus,
} from './types/task';

const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  status: 'All',
  priority: 'All',
  category: 'All',
  tag: 'All',
  dueDate: '',
  timeframe: 'all',
  sortBy: 'dueDate',
  order: 'asc',
};

export default function App() {
  const [activeView, setActiveView] = useState<NavView>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [dbUnavailable, setDbUnavailable] = useState(false);

  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback(
    (type: 'success' | 'error', message: string) => {
      setToast({ type, message });
    },
    []
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const healthData = await fetchHealth();
      setHealth(healthData);

      // Show a non-blocking banner if MONGODB_URI is configured but not yet connected,
      // while keeping the dashboard operational via server-side JSON storage.
      setDbUnavailable(
        Boolean(healthData.database.configured && !healthData.database.connected)
      );

      const effectiveFilters: TaskFilters = { ...filters };
      if (activeView === 'today') {
        effectiveFilters.timeframe = 'today';
      }

      const [filteredList, fullList, statsData] = await Promise.all([
        fetchTasks(effectiveFilters),
        fetchTasks({ sortBy: 'dueDate', order: 'asc' }),
        fetchTaskStats(),
      ]);

      setTasks(filteredList);
      setAllTasks(fullList);
      setStats(statsData);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'DB_NOT_CONNECTED') {
        setDbUnavailable(true);
        setApiError(err.message);
      } else {
        setApiError(
          err instanceof Error
            ? err.message
            : 'Failed to load tasks from the server.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [filters, activeView]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRetryHealth = async () => {
    setCheckingHealth(true);
    try {
      await loadData();
    } finally {
      setCheckingHealth(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setViewingTask(null);
    setEditingTask(task);
    setFormModalOpen(true);
  };

  const handleSubmitTask = async (payload: TaskFormPayload) => {
    if (editingTask) {
      const updated = await updateTask(editingTask._id, payload);
      showToast('success', `Updated "${updated.title}".`);
    } else {
      const created = await createTask(payload);
      showToast('success', `Created "${created.title}".`);
    }
    await loadData();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    const title = deletingTask.title;
    try {
      await deleteTask(deletingTask._id);
      setDeletingTask(null);
      if (viewingTask?._id === deletingTask._id) {
        setViewingTask(null);
      }
      showToast('success', `Deleted "${title}".`);
      await loadData();
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Unable to delete task.'
      );
    }
  };

  const handleCycleStatus = async (task: Task) => {
    const nextStatus: TaskStatus =
      task.status === 'Pending'
        ? 'In Progress'
        : task.status === 'In Progress'
        ? 'Completed'
        : 'Pending';
    const nextProgress =
      nextStatus === 'Completed' ? 100 : nextStatus === 'Pending' ? 0 : 50;

    try {
      await updateTask(task._id, {
        status: nextStatus,
        progress: nextProgress,
      });
      showToast('success', `"${task.title}" marked as ${nextStatus}.`);
      await loadData();
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Unable to update task status.'
      );
    }
  };

  const handleMarkComplete = async (task: Task) => {
    try {
      await updateTask(task._id, { status: 'Completed', progress: 100 });
      showToast('success', `Completed "${task.title}".`);
      await loadData();
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Unable to complete task.'
      );
    }
  };

  const handleUpdateProgress = async (
    task: Task,
    progress: number,
    status?: TaskStatus
  ) => {
    const updated = await updateTask(task._id, {
      progress,
      status,
    });
    setViewingTask(updated);
    showToast('success', `Progress updated to ${updated.progress}%.`);
    await loadData();
  };

  const handleLoadSamples = async () => {
    try {
      const result = await seedSampleTasks();
      if (result.inserted > 0) {
        showToast(
          'success',
          `Loaded ${result.inserted} sample student tasks.`
        );
      } else {
        showToast('success', 'Existing tasks are already loaded.');
      }
      await loadData();
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Unable to load sample tasks.'
      );
    }
  };

  const handleSyncJsonTasks = async () => {
    try {
      const result = await syncJsonTasks();
      showToast(
        'success',
        `Imported ${result.migrated} task(s) to MongoDB Atlas (${result.skipped} already existed).`
      );
      await loadData();
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Unable to import JSON tasks.'
      );
    }
  };

  const handleQuickSummaryFilter = (
    filter: 'all' | 'pending' | 'completed' | 'overdue' | 'today'
  ) => {
    setActiveView('tasks');
    if (filter === 'all') {
      setFilters(DEFAULT_FILTERS);
    } else if (filter === 'pending') {
      setFilters({ ...DEFAULT_FILTERS, status: 'Pending' });
    } else if (filter === 'completed') {
      setFilters({ ...DEFAULT_FILTERS, status: 'Completed' });
    } else if (filter === 'overdue') {
      setFilters({ ...DEFAULT_FILTERS, timeframe: 'overdue' });
    } else if (filter === 'today') {
      setFilters({ ...DEFAULT_FILTERS, timeframe: 'today' });
    }
  };

  const alertTasks = allTasks.filter((t) => {
    if (t.status === 'Completed') return false;
    const d = evaluateClientDeadline(t.dueDate, t.dueTime, t.status);
    return d.isOverdue || d.isDueToday || d.isApproaching;
  });

  const todayAndOverdueTasks = allTasks.filter((t) => {
    const d = evaluateClientDeadline(t.dueDate, t.dueTime, t.status);
    return d.isDueToday || d.isOverdue;
  });

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          if (view === 'tasks' && filters.timeframe === 'today') {
            setFilters({ ...filters, timeframe: 'all' });
          }
        }}
        alertCount={alertTasks.length}
        todayCount={stats?.todayRemainingTasks ?? 0}
        dbConnected={Boolean(health?.database.connected)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          activeView={activeView}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onCreateTask={handleOpenCreate}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto space-y-6">
          {dbUnavailable && activeView !== 'setup' && (
            <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    MongoDB Atlas Connection Pending (Using JSON Storage)
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {health?.database.error ||
                      'Set a valid MONGODB_URI in Settings → Secrets to switch persistence to MongoDB Atlas.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveView('setup')}
                  className="px-3.5 py-2 min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                >
                  Setup Guide
                </button>
                <button
                  type="button"
                  onClick={handleRetryHealth}
                  disabled={checkingHealth}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white whitespace-nowrap"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${checkingHealth ? 'animate-spin' : ''}`}
                  />
                  <span>Retry</span>
                </button>
              </div>
            </div>
          )}

          {apiError && !dbUnavailable && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sm text-red-700 dark:text-red-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{apiError}</span>
              </div>
              <button
                type="button"
                onClick={handleRetryHealth}
                className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40"
              >
                Retry
              </button>
            </div>
          )}

          {activeView === 'dashboard' && (
            <>
              <SummaryCards
                stats={stats}
                loading={loading}
                onQuickFilter={handleQuickSummaryFilter}
              />

              <DashboardCharts
                stats={stats}
                darkMode={darkMode}
                onCreateTask={handleOpenCreate}
                onLoadSamples={handleLoadSamples}
              />

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                <div className="xl:col-span-2 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Recent &amp; Upcoming Tasks
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveView('tasks')}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                    >
                      View all tasks
                    </button>
                  </div>
                  <TaskToolbar
                    filters={filters}
                    categories={stats?.categories ?? []}
                    tags={stats?.tags ?? []}
                    onChange={setFilters}
                    onReset={() => setFilters(DEFAULT_FILTERS)}
                  />
                  <TaskList
                    tasks={tasks}
                    loading={loading}
                    onViewTask={setViewingTask}
                    onEditTask={handleOpenEdit}
                    onDeleteTask={setDeletingTask}
                    onCycleStatus={handleCycleStatus}
                    onCreateTask={handleOpenCreate}
                    onLoadSamples={
                      allTasks.length === 0 ? handleLoadSamples : undefined
                    }
                  />
                </div>

                <div className="xl:col-span-1">
                  <DeadlineAlertsPanel
                    tasks={allTasks}
                    onSelectTask={setViewingTask}
                    onMarkComplete={handleMarkComplete}
                    compact
                  />
                </div>
              </div>
            </>
          )}

          {activeView === 'tasks' && (
            <div className="space-y-4">
              {filters.timeframe !== 'all' && (
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs">
                  <span className="text-slate-600 dark:text-slate-300">
                    Showing filtered view:{' '}
                    <strong className="text-slate-900 dark:text-slate-100 capitalize">
                      {filters.timeframe}
                    </strong>{' '}
                    tasks
                  </span>
                  <button
                    type="button"
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                  >
                    Show all tasks
                  </button>
                </div>
              )}

              <TaskToolbar
                filters={filters}
                categories={stats?.categories ?? []}
                tags={stats?.tags ?? []}
                onChange={setFilters}
                onReset={() => setFilters(DEFAULT_FILTERS)}
              />

              <TaskList
                tasks={tasks}
                loading={loading}
                onViewTask={setViewingTask}
                onEditTask={handleOpenEdit}
                onDeleteTask={setDeletingTask}
                onCycleStatus={handleCycleStatus}
                onCreateTask={handleOpenCreate}
                onLoadSamples={
                  allTasks.length === 0 ? handleLoadSamples : undefined
                }
              />
            </div>
          )}

          {activeView === 'today' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Today &amp; Overdue Priorities
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tasks scheduled for today or past their deadline so you can
                    focus on immediate submissions.
                  </p>
                </div>
                <span className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-300">
                  {todayAndOverdueTasks.length} task(s)
                </span>
              </div>

              <TaskList
                tasks={todayAndOverdueTasks}
                loading={loading}
                onViewTask={setViewingTask}
                onEditTask={handleOpenEdit}
                onDeleteTask={setDeletingTask}
                onCycleStatus={handleCycleStatus}
                onCreateTask={handleOpenCreate}
              />
            </div>
          )}

          {activeView === 'alerts' && (
            <DeadlineAlertsPanel
              tasks={allTasks}
              onSelectTask={setViewingTask}
              onMarkComplete={handleMarkComplete}
            />
          )}

          {activeView === 'setup' && (
            <MongoSetupView
              health={health}
              checking={checkingHealth}
              onRetryConnection={handleRetryHealth}
              onLoadSamples={
                allTasks.length === 0 ? handleLoadSamples : undefined
              }
              onSyncJsonTasks={handleSyncJsonTasks}
            />
          )}
        </main>
      </div>

      {formModalOpen && (
        <TaskFormModal
          initialTask={editingTask}
          onClose={() => {
            setFormModalOpen(false);
            setEditingTask(null);
          }}
          onSubmit={handleSubmitTask}
        />
      )}

      {viewingTask && (
        <TaskDetailModal
          task={viewingTask}
          onClose={() => setViewingTask(null)}
          onEdit={handleOpenEdit}
          onDelete={(t) => {
            setViewingTask(null);
            setDeletingTask(t);
          }}
          onUpdateProgress={handleUpdateProgress}
        />
      )}

      {deletingTask && (
        <DeleteConfirmModal
          task={deletingTask}
          onCancel={() => setDeletingTask(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-slate-100'
              : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-200'
          }`}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
