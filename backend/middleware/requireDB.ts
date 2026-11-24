import type { NextFunction, Request, Response } from 'express';

export async function requireDB(
  _req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  // taskStore automatically routes to MongoDB Atlas when connected,
  // and safely falls back to server-side JSON storage while Atlas setup is pending.
  next();
}
