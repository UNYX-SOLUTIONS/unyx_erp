import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendSuccess } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import * as authService from './auth-service';
import type { LoginInput, RefreshInput, RegisterInput } from './auth-schema';

function sessionMeta(req: Request) {
  return { userAgent: req.headers['user-agent'], ipAddress: req.ip };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = await authService.register(req.body as RegisterInput, sessionMeta(req));
  sendSuccess(res, data, undefined, StatusCodes.CREATED);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = await authService.login(req.body as LoginInput, sessionMeta(req));
  sendSuccess(res, data);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const data = await authService.refresh(req.body as RefreshInput, sessionMeta(req));
  sendSuccess(res, data);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout((req.body as RefreshInput).refreshToken);
  sendSuccess(res, { message: 'Sesión cerrada' });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const data = await authService.getMe(req.user?.id as string);
  sendSuccess(res, data);
});
