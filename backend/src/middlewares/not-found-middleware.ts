import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '../utils/api-response';

export function notFoundHandler(req: Request, res: Response): void {
  sendError(
    res,
    StatusCodes.NOT_FOUND,
    `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    'ROUTE_NOT_FOUND'
  );
}
