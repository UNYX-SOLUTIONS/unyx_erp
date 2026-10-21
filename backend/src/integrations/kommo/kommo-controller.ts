import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import * as altosaService from '../altosa/altosa-service';

export const listTemplates = asyncHandler(async (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
  const result = await altosaService.searchKommoTemplates(search || undefined);
  sendSuccess(res, result.data);
});

export const syncTemplates = asyncHandler(async (_req: Request, res: Response) => {
  const result = await altosaService.syncKommoTemplates();
  sendSuccess(res, result.data);
});
