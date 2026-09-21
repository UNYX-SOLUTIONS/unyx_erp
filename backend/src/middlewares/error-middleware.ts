import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../utils/api-error';
import { sendError } from '../utils/api-response';
import { logger } from '../config/logger';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    sendError(res, err.statusCode, err.message, err.code, err.details);
    return;
  }
  if (err instanceof ZodError) {
    sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'Datos inválidos',
      'VALIDATION_ERROR',
      err.flatten().fieldErrors
    );
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      sendError(
        res,
        StatusCodes.CONFLICT,
        'Registro duplicado',
        'DUPLICATE_ENTRY',
        err.meta?.target
      );
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, StatusCodes.NOT_FOUND, 'Registro no encontrado', 'RECORD_NOT_FOUND');
      return;
    }
    sendError(res, StatusCodes.BAD_REQUEST, 'Error de base de datos', 'DATABASE_ERROR');
    return;
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    sendError(
      res,
      StatusCodes.BAD_REQUEST,
      'Datos inválidos para la base de datos',
      'DATABASE_VALIDATION'
    );
    return;
  }
  const status =
    (err as { status?: unknown }).status ?? (err as { statusCode?: unknown }).statusCode;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    sendError(
      res,
      status,
      err instanceof Error ? err.message : 'Error en la solicitud',
      'REQUEST_ERROR'
    );
    return;
  }
  logger.error(err);
  sendError(
    res,
    StatusCodes.INTERNAL_SERVER_ERROR,
    'Error interno del servidor',
    'INTERNAL_SERVER_ERROR'
  );
}
