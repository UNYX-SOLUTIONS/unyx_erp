import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

export const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info('PostgreSQL conectado');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
