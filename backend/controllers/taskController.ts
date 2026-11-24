import type { NextFunction, Request, Response } from 'express';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from '../models/Task.ts';
import {
  createTaskRecord,
  deleteTaskRecord,
  findAllTasks,
  findTaskById,
  findTasks,
  seedTasksIfEmpty,
  syncJsonTasksToMongo,
  updateTaskRecord,
  type CreateTaskInput,
  type TaskQueryFilters,
} from '../storage/taskStore.ts';
import {
  evaluateDeadline,
  getReferenceNow,
  toDateKey,
} from '../utils/deadline.ts';

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

export async function getTasks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const queryFilters: TaskQueryFilters = {};

    const {
      search,
      status,
      priority,
      category,
      tag,
      dueDate,
      timeframe,
      sortBy,
      order,
      clientDate,
      clientTime,
    } = req.query;

    if (typeof search === 'string' && search.trim().length > 0) {
      queryFilters.search = search.trim();
    }

    if (
      typeof status === 'string' &&
      TASK_STATUSES.includes(status as TaskStatus)
    ) {
      queryFilters.status = status as TaskStatus;
    }

    if (
      typeof priority === 'string' &&
      TASK_PRIORITIES.includes(priority as TaskPriority)
    ) {
      queryFilters.priority = priority as TaskPriority;
    }

    if (typeof category === 'string' && category.trim().length > 0) {
      queryFilters.category = category.trim();
    }

    if (typeof tag === 'string' && tag.trim().length > 0) {
      queryFilters.tag = tag.trim();
    }

    if (typeof dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      queryFilters.dueDate = dueDate;
    }

    const direction = order === 'desc' ? -1 : 1;
    let tasks = await findTasks(queryFilters);

    const { todayKey, nowMs } = getReferenceNow(
      typeof clientDate === 'string' ? clientDate : undefined,
      typeof clientTime === 'string' ? clientTime : undefined
    );

    if (typeof timeframe === 'string') {
      tasks = tasks.filter((task) => {
        const info = evaluateDeadline(
          task.dueDate,
          task.dueTime,
          task.status,
          todayKey,
          nowMs
        );
        if (timeframe === 'today') return info.isDueToday;
        if (timeframe === 'overdue') return info.isOverdue;
        if (timeframe === 'upcoming')
          return task.status !== 'Completed' && !info.isOverdue;
        if (timeframe === 'approaching') return info.isApproaching;
        return true;
      });
    }

    if (sortBy === 'priority') {
      tasks.sort(
        (a, b) =>
          (PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]) *
          direction
      );
    } else if (sortBy === 'progress') {
      tasks.sort((a, b) => (a.progress - b.progress) * direction);
    } else if (sortBy === 'createdAt') {
      tasks.sort(
        (a, b) =>
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
          direction
      );
    } else {
      tasks.sort((a, b) => {
        const cmp =
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (cmp !== 0) return cmp * direction;
        return a.dueTime.localeCompare(b.dueTime) * direction;
      });
    }

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTaskStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { clientDate, clientTime } = req.query;
    const { todayKey, nowMs } = getReferenceNow(
      typeof clientDate === 'string' ? clientDate : undefined,
      typeof clientTime === 'string' ? clientTime : undefined
    );

    const tasks = await findAllTasks();

    let pendingTasks = 0;
    let inProgressTasks = 0;
    let completedTasks = 0;
    let overdueTasks = 0;
    let todayTasks = 0;
    let todayRemainingTasks = 0;
    let approachingTasks = 0;
    let progressSum = 0;

    const priorityDistribution: Record<TaskPriority, number> = {
      Low: 0,
      Medium: 0,
      High: 0,
    };

    const statusDistribution: Record<TaskStatus, number> = {
      Pending: 0,
      'In Progress': 0,
      Completed: 0,
    };

    const categoryMap = new Map<
      string,
      { category: string; total: number; completed: number }
    >();
    const tagSet = new Set<string>();

    const [ty, tm, td] = todayKey.split('-').map(Number);
    const weekDays: {
      dateKey: string;
      label: string;
      due: number;
      completed: number;
    }[] = [];
    const dayIndexMap = new Map<string, number>();

    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.UTC(ty, tm - 1, td + i));
      const key = toDateKey(d);
      const label = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      });
      dayIndexMap.set(key, i);
      weekDays.push({ dateKey: key, label, due: 0, completed: 0 });
    }

    for (const task of tasks) {
      progressSum += task.progress;
      priorityDistribution[task.priority] =
        (priorityDistribution[task.priority] || 0) + 1;
      statusDistribution[task.status] =
        (statusDistribution[task.status] || 0) + 1;

      if (task.status === 'Pending') pendingTasks++;
      else if (task.status === 'In Progress') inProgressTasks++;
      else if (task.status === 'Completed') completedTasks++;

      const deadline = evaluateDeadline(
        task.dueDate,
        task.dueTime,
        task.status,
        todayKey,
        nowMs
      );

      if (deadline.isOverdue) overdueTasks++;
      if (deadline.isDueToday) {
        todayTasks++;
        if (task.status !== 'Completed') todayRemainingTasks++;
      }
      if (deadline.isApproaching) approachingTasks++;

      const catEntry = categoryMap.get(task.category) ?? {
        category: task.category,
        total: 0,
        completed: 0,
      };
      catEntry.total++;
      if (task.status === 'Completed') catEntry.completed++;
      categoryMap.set(task.category, catEntry);

      for (const t of task.tags) {
        tagSet.add(t);
      }

      const dayIdx = dayIndexMap.get(deadline.dateKey);
      if (dayIdx !== undefined) {
        weekDays[dayIdx].due++;
        if (task.status === 'Completed') {
          weekDays[dayIdx].completed++;
        }
      }
    }

    const totalTasks = tasks.length;
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const averageProgress =
      totalTasks > 0 ? Math.round(progressSum / totalTasks) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        overdueTasks,
        todayTasks,
        todayRemainingTasks,
        approachingTasks,
        completionRate,
        averageProgress,
        priorityDistribution,
        statusDistribution,
        categoryDistribution: Array.from(categoryMap.values()).sort(
          (a, b) => b.total - a.total
        ),
        weeklySchedule: weekDays,
        categories: Array.from(categoryMap.keys()).sort(),
        tags: Array.from(tagSet).sort(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getTaskById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const task = await findTaskById(String(req.params.id));
    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

export async function createTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const task = await createTaskRecord(req.body as CreateTaskInput);
    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const updated = await updateTaskRecord(
      String(req.params.id),
      req.body as Partial<CreateTaskInput>
    );
    if (!updated) {
      res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const deletedId = await deleteTaskRecord(String(req.params.id));
    if (!deletedId) {
      res.status(404).json({
        success: false,
        message: 'Task not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
      data: { _id: deletedId },
    });
  } catch (err) {
    next(err);
  }
}

export async function seedSampleTasks(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await seedTasksIfEmpty();
    res.status(200).json({
      success: true,
      message:
        result.inserted > 0
          ? `Loaded ${result.inserted} sample student tasks into ${result.storageMode === 'mongodb' ? 'MongoDB' : 'JSON storage'}.`
          : `Existing ${result.existing} task(s) preserved.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function syncJsonTasks(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await syncJsonTasksToMongo();
    res.status(200).json({
      success: true,
      message: `Synced ${result.migrated} task(s) from JSON storage into MongoDB Atlas.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
