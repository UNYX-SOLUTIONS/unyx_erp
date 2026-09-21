import { Router } from 'express';
import { sendSuccess } from '../utils/api-response';
import { authRoutes } from '../modules/auth/auth-routes';

export const router = Router();

router.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
