import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { BarChart3 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { TaskStats } from '../types/task';

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip
);

interface DashboardChartsProps {
  stats: TaskStats | null;
  darkMode: boolean;
  onCreateTask: () => void;
  onLoadSamples?: () => void;
}

export function DashboardCharts({
  stats,
  darkMode,
  onCreateTask,
  onLoadSamples,
}: DashboardChartsProps) {
  const statusCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const priorityCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scheduleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const hasTasks = Boolean(stats && stats.totalTasks > 0);

  useEffect(() => {
    if (!stats || !hasTasks) return;

    const textColor = darkMode ? '#cbd5e1' : '#475569';
    const gridColor = darkMode ? 'rgba(148, 163, 184, 0.14)' : 'rgba(15, 23, 42, 0.08)';

    const charts: Chart[] = [];

    if (statusCanvasRef.current) {
      charts.push(
        new Chart(statusCanvasRef.current, {
          type: 'doughnut',
          data: {
            labels: ['Completed', 'In Progress', 'Pending'],
            datasets: [
              {
                data: [
                  stats.statusDistribution.Completed,
                  stats.statusDistribution['In Progress'],
                  stats.statusDistribution.Pending,
                ],
                backgroundColor: ['#16a34a', '#2563eb', '#d97706'],
                borderColor: darkMode ? '#0f172a' : '#ffffff',
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '66%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: textColor,
                  boxWidth: 12,
                  padding: 14,
                  font: { family: 'DM Sans, sans-serif', size: 12 },
                },
              },
            },
          },
        })
      );
    }

    if (priorityCanvasRef.current) {
      charts.push(
        new Chart(priorityCanvasRef.current, {
          type: 'bar',
          data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [
              {
                label: 'Tasks',
                data: [
                  stats.priorityDistribution.High,
                  stats.priorityDistribution.Medium,
                  stats.priorityDistribution.Low,
                ],
                backgroundColor: ['#dc2626', '#d97706', '#2563eb'],
                borderRadius: 6,
                maxBarThickness: 44,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: textColor },
              },
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1, precision: 0, color: textColor },
                grid: { color: gridColor },
              },
            },
          },
        })
      );
    }

    if (scheduleCanvasRef.current) {
      charts.push(
        new Chart(scheduleCanvasRef.current, {
          type: 'bar',
          data: {
            labels: stats.weeklySchedule.map((d) => d.label.split(',')[0]),
            datasets: [
              {
                label: 'Due Tasks',
                data: stats.weeklySchedule.map((d) => d.due),
                backgroundColor: '#2563eb',
                borderRadius: 5,
                maxBarThickness: 28,
              },
              {
                label: 'Completed',
                data: stats.weeklySchedule.map((d) => d.completed),
                backgroundColor: '#16a34a',
                borderRadius: 5,
                maxBarThickness: 28,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: textColor,
                  boxWidth: 12,
                  padding: 12,
                  font: { family: 'DM Sans, sans-serif', size: 12 },
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: textColor, font: { size: 11 } },
              },
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1, precision: 0, color: textColor },
                grid: { color: gridColor },
              },
            },
          },
        })
      );
    }

    return () => {
      for (const c of charts) {
        c.destroy();
      }
    };
  }, [stats, hasTasks, darkMode]);

  if (!hasTasks) {
    return (
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
        <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <BarChart3 className="h-5 w-5" />
        </div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Productivity Charts Ready
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Add your first task or load sample B.Tech tasks to populate live
          completion, priority distribution, and 7-day schedule charts.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onCreateTask}
            className="inline-flex items-center px-4 py-2 min-h-[40px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            Create First Task
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
      </section>
    );
  }

  return (
    <section
      aria-label="Productivity analytics charts"
      className="grid grid-cols-1 lg:grid-cols-3 gap-4"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col">
        <div className="flex items-baseline justify-between gap-2 mb-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Completion Status
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {stats?.completionRate ?? 0}% done
          </span>
        </div>
        <div className="relative h-52 w-full">
          <canvas ref={statusCanvasRef} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col">
        <div className="flex items-baseline justify-between gap-2 mb-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Priority Breakdown
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {stats?.priorityDistribution.High ?? 0} high
          </span>
        </div>
        <div className="relative h-52 w-full">
          <canvas ref={priorityCanvasRef} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col">
        <div className="flex items-baseline justify-between gap-2 mb-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            7-Day Deadline Load
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {stats?.approachingTasks ?? 0} due in 48h
          </span>
        </div>
        <div className="relative h-52 w-full">
          <canvas ref={scheduleCanvasRef} />
        </div>
      </div>
    </section>
  );
}
