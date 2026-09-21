import { rateLimit } from 'express-rate-limit';
import { buildErrorBody } from '../utils/api-response';

const RATE_LIMIT_MESSAGE = buildErrorBody(
  'Demasiadas solicitudes, intente más tarde',
  'RATE_LIMITED'
);

export function apiRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: RATE_LIMIT_MESSAGE,
  });
}

export function authRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: RATE_LIMIT_MESSAGE,
  });
}
