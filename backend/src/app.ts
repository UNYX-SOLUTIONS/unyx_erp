import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { apiRateLimiter } from './middlewares/rate-limit-middleware';
import { errorHandler } from './middlewares/error-middleware';
import { notFoundHandler } from './middlewares/not-found-middleware';
import { router } from './routes';

export const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin:
      env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
    credentials: true,
  })
);
app.use(apiRateLimiter());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(compression());
app.use(pinoHttp({ logger }));

app.use('/api/v1', router);

app.use(notFoundHandler);
app.use(errorHandler);
