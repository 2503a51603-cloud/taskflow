import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from '../models/Task.ts';

export function validateObjectId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { id } = req.params;
  if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({
      success: false,
      message: 'Invalid task ID format.',
    });
    return;
  }
  next();
}

function normalizeProgressAndStatus(
  statusInput: TaskStatus | undefined,
  progressInput: number | undefined,
  isCreate: boolean
): { status?: TaskStatus; progress?: number } {
  let status = statusInput;
  let progress = progressInput;

  if (status === 'Completed') {
    progress = 100;
  } else if (status === 'Pending' && progress === undefined) {
    progress = 0;
  } else if (status === 'Pending' && progress !== undefined && progress > 0 && progress < 100) {
    status = 'In Progress';
  } else if (progress === 100) {
    status = 'Completed';
  } else if (progress === 0 && status === 'In Progress') {
    // Allow In Progress at 0% if explicitly selected, or keep explicit status
    progress = 0;
  } else if (status === 'In Progress' && progress === undefined && isCreate) {
    progress = 25;
  }

  return { status, progress };
}

export function validateCreateTask(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const body = req.body as Record<string, unknown>;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    res.status(400).json({ success: false, message: 'Invalid request payload.' });
    return;
  }

  if (typeof body.title !== 'string' || body.title.trim().length < 2) {
    res.status(400).json({
      success: false,
      message: 'Task title is required and must be at least 2 characters.',
    });
    return;
  }
  if (body.title.trim().length > 140) {
    res.status(400).json({
      success: false,
      message: 'Task title cannot exceed 140 characters.',
    });
    return;
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Description must be plain text.',
    });
    return;
  }

  if (typeof body.dueDate !== 'string' && !(body.dueDate instanceof Date)) {
    res.status(400).json({
      success: false,
      message: 'A valid due date is required.',
    });
    return;
  }

  const parsedDate = new Date(body.dueDate as string);
  if (Number.isNaN(parsedDate.getTime())) {
    res.status(400).json({
      success: false,
      message: 'Due date is not a valid date.',
    });
    return;
  }

  const dueTime =
    typeof body.dueTime === 'string' && body.dueTime.trim() !== ''
      ? body.dueTime.trim()
      : '23:59';
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(dueTime)) {
    res.status(400).json({
      success: false,
      message: 'Due time must be in HH:MM (24-hour) format.',
    });
    return;
  }

  const priority = (
    typeof body.priority === 'string' ? body.priority.trim() : 'Medium'
  ) as TaskPriority;
  if (!TASK_PRIORITIES.includes(priority)) {
    res.status(400).json({
      success: false,
      message: 'Priority must be Low, Medium, or High.',
    });
    return;
  }

  const category =
    typeof body.category === 'string' && body.category.trim() !== ''
      ? body.category.trim()
      : 'Academic';
  if (category.length > 50) {
    res.status(400).json({
      success: false,
      message: 'Category cannot exceed 50 characters.',
    });
    return;
  }

  let tags: string[] = [];
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      res.status(400).json({
        success: false,
        message: 'Tags must be an array of strings.',
      });
      return;
    }
    const cleanTags = body.tags
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t.length <= 30);
    tags = Array.from(new Set(cleanTags)).slice(0, 10);
  }

  const rawStatus = (
    typeof body.status === 'string' ? body.status.trim() : 'Pending'
  ) as TaskStatus;
  if (!TASK_STATUSES.includes(rawStatus)) {
    res.status(400).json({
      success: false,
      message: 'Status must be Pending, In Progress, or Completed.',
    });
    return;
  }

  let rawProgress: number | undefined;
  if (body.progress !== undefined) {
    const num = Number(body.progress);
    if (!Number.isFinite(num) || num < 0 || num > 100) {
      res.status(400).json({
        success: false,
        message: 'Progress must be a number between 0 and 100.',
      });
      return;
    }
    rawProgress = Math.round(num);
  }

  const normalized = normalizeProgressAndStatus(rawStatus, rawProgress, true);

  req.body = {
    title: body.title.trim(),
    description: typeof body.description === 'string' ? body.description.trim() : '',
    dueDate: parsedDate,
    dueTime,
    priority,
    category,
    tags,
    status: normalized.status ?? 'Pending',
    progress: normalized.progress ?? 0,
  };

  next();
}

export function validateUpdateTask(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const body = req.body as Record<string, unknown>;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    res.status(400).json({ success: false, message: 'Invalid request payload.' });
    return;
  }

  const sanitized: Record<string, unknown> = {};

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Task title must be at least 2 characters.',
      });
      return;
    }
    if (body.title.trim().length > 140) {
      res.status(400).json({
        success: false,
        message: 'Task title cannot exceed 140 characters.',
      });
      return;
    }
    sanitized.title = body.title.trim();
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Description must be plain text.',
      });
      return;
    }
    if (body.description.trim().length > 2000) {
      res.status(400).json({
        success: false,
        message: 'Description cannot exceed 2000 characters.',
      });
      return;
    }
    sanitized.description = body.description.trim();
  }

  if (body.dueDate !== undefined) {
    if (typeof body.dueDate !== 'string' && !(body.dueDate instanceof Date)) {
      res.status(400).json({
        success: false,
        message: 'Due date must be a valid date string.',
      });
      return;
    }
    const parsed = new Date(body.dueDate as string);
    if (Number.isNaN(parsed.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Due date is not a valid date.',
      });
      return;
    }
    sanitized.dueDate = parsed;
  }

  if (body.dueTime !== undefined) {
    if (
      typeof body.dueTime !== 'string' ||
      !/^([01]\d|2[0-3]):([0-5]\d)$/.test(body.dueTime.trim())
    ) {
      res.status(400).json({
        success: false,
        message: 'Due time must be in HH:MM (24-hour) format.',
      });
      return;
    }
    sanitized.dueTime = body.dueTime.trim();
  }

  if (body.priority !== undefined) {
    if (
      typeof body.priority !== 'string' ||
      !TASK_PRIORITIES.includes(body.priority.trim() as TaskPriority)
    ) {
      res.status(400).json({
        success: false,
        message: 'Priority must be Low, Medium, or High.',
      });
      return;
    }
    sanitized.priority = body.priority.trim();
  }

  if (body.category !== undefined) {
    if (
      typeof body.category !== 'string' ||
      body.category.trim().length === 0 ||
      body.category.trim().length > 50
    ) {
      res.status(400).json({
        success: false,
        message: 'Category must be between 1 and 50 characters.',
      });
      return;
    }
    sanitized.category = body.category.trim();
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      res.status(400).json({
        success: false,
        message: 'Tags must be an array of strings.',
      });
      return;
    }
    const cleanTags = body.tags
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t.length <= 30);
    sanitized.tags = Array.from(new Set(cleanTags)).slice(0, 10);
  }

  let statusInput: TaskStatus | undefined;
  if (body.status !== undefined) {
    if (
      typeof body.status !== 'string' ||
      !TASK_STATUSES.includes(body.status.trim() as TaskStatus)
    ) {
      res.status(400).json({
        success: false,
        message: 'Status must be Pending, In Progress, or Completed.',
      });
      return;
    }
    statusInput = body.status.trim() as TaskStatus;
  }

  let progressInput: number | undefined;
  if (body.progress !== undefined) {
    const num = Number(body.progress);
    if (!Number.isFinite(num) || num < 0 || num > 100) {
      res.status(400).json({
        success: false,
        message: 'Progress must be a number between 0 and 100.',
      });
      return;
    }
    progressInput = Math.round(num);
  }

  const normalized = normalizeProgressAndStatus(statusInput, progressInput, false);
  if (normalized.status !== undefined) {
    sanitized.status = normalized.status;
  }
  if (normalized.progress !== undefined) {
    sanitized.progress = normalized.progress;
  }

  if (Object.keys(sanitized).length === 0) {
    res.status(400).json({
      success: false,
      message: 'No valid fields provided for update.',
    });
    return;
  }

  req.body = sanitized;
  next();
}
