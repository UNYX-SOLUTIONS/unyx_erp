/**
 * Backfill único: copia los mapeos Contifico que ya existen en el staging
 * local del ERP (sourceRowKey = contifico:<id>) hacia Altosa, sin llamar a
 * Contifico y sin crear productos nuevos en Altosa.
 *
 * Solo procesa productos locales que ya existen en Altosa (match por SKU).
 * Uso: pnpm backfill:altosa-mappings
 */
import { prisma } from '../src/config/database';
import { logger } from '../src/config/logger';
import { altosaGet } from '../src/integrations/altosa/altosa-client';
import { syncLocalProductToAltosa } from '../src/integrations/altosa/altosa-local-sync';

async function main(): Promise<void> {
  const products = await prisma.kbProduct.findMany({
    where: {
      deletedAt: null,
      OR: [
        { sourceRowKey: { not: null } },
        {
          variants: {
            some: { sourceRowKey: { startsWith: 'contifico:' } },
          },
        },
      ],
    },
    select: {
      id: true,
      sku: true,
      variants: {
        where: { deletedAt: null },
        select: { sku: true, sourceRowKey: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  let synced = 0;
  let skipped = 0;
  let failed = 0;

  for (const [index, product] of products.entries()) {
    const mappedVariant = product.variants.find((variant) =>
      variant.sourceRowKey?.startsWith('contifico:')
    );
    const sku = mappedVariant?.sku ?? product.sku;

    try {
      await altosaGet(`/api/v1/products/sku/${encodeURIComponent(sku)}`);
    } catch {
      skipped += 1;
      if ((index + 1) % 25 === 0) {
        logger.info(
          { processed: index + 1, total: products.length, synced, skipped, failed },
          'Backfill de mapeos Altosa en progreso'
        );
      }
      continue;
    }

    const ok = await syncLocalProductToAltosa(product.id);
    if (ok) {
      synced += 1;
    } else {
      failed += 1;
    }

    if ((index + 1) % 25 === 0) {
      logger.info(
        { processed: index + 1, total: products.length, synced, skipped, failed },
        'Backfill de mapeos Altosa en progreso'
      );
    }
  }

  logger.info(
    { total: products.length, synced, skipped, failed },
    'Backfill de mapeos Altosa finalizado'
  );
}

main()
  .catch((error) => {
    logger.error({ err: error }, 'Falló el backfill de mapeos Altosa');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
