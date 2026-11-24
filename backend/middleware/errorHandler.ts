import type { NextFunction, Request, Response } from 'express';

interface AppError extends Error {
  statusCode?: number;
  name: string;
  errors?: Record<string, { message: string }>;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors).map((e) => e.message);
    res.status(400).json({
      success: false,
      message: messages.join(', '),
    });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid identifier or field type.',
    });
    return;
  }

  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? 'An unexpected server error occurred while processing your request.'
        : err.message,
  });
}
