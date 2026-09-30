import { PrismaClient as AltosaPrismaClient } from 'client-altosa';

let altosaClient: AltosaPrismaClient | null = null;

export function getAltosaClient(): AltosaPrismaClient {
  if (!altosaClient) {
    altosaClient = new AltosaPrismaClient({ log: ['warn', 'error'] });
  }
  return altosaClient;
}

export async function disconnectAltosaClient(): Promise<void> {
  if (altosaClient) {
    await altosaClient.$disconnect();
    altosaClient = null;
  }
}
