import { Router } from 'express';
import { authenticate } from '../../middlewares/auth-middleware';
import { validate } from '../../middlewares/validate-middleware';
import { authRateLimiter } from '../../middlewares/rate-limit-middleware';
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from './auth-schema';
import * as authController from './auth-controller';

export const authRoutes = Router();

authRoutes.post('/register', authRateLimiter(), validate(registerSchema), authController.register);
authRoutes.post('/login', authRateLimiter(), validate(loginSchema), authController.login);
authRoutes.post('/refresh', validate(refreshSchema), authController.refresh);
authRoutes.post('/logout', authenticate, validate(logoutSchema), authController.logout);
authRoutes.get('/me', authenticate, authController.me);
