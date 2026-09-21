import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { app } from './app';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  const server = app.listen(env.PORT, () => {
    logger.info(`API escuchando en http://localhost:${env.PORT}`);
  });

  const shutdown = (signal: string): void => {
    logger.info(`Señal ${signal} recibida, cerrando servidor...`);
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

void bootstrap().catch((error: unknown) => {
  logger.fatal(error);
  process.exit(1);
});
