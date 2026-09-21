import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { PaginationMeta } from './pagination';

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: PaginationMeta,
  statusCode: number = StatusCodes.OK
): void {
  res.status(statusCode).json({ success: true, data, meta });
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  code?: string,
  details?: unknown
): void {
  res.status(statusCode).json({ success: false, message, code, details });
}
