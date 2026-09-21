import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyAccessToken } from '../utils/jwt';
import { ApiError } from '../utils/api-error';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Token de acceso requerido', 'AUTH_TOKEN_MISSING');
  }
  try {
    req.user = verifyAccessToken(header.slice('Bearer '.length));
    next();
  } catch {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Token inválido o expirado', 'AUTH_TOKEN_INVALID'));
  }
}
