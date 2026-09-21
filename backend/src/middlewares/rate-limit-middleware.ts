import { rateLimit } from 'express-rate-limit';

const RATE_LIMIT_MESSAGE = {
  success: false,
  message: 'Demasiadas solicitudes, intente más tarde',
  code: 'RATE_LIMITED',
};

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
