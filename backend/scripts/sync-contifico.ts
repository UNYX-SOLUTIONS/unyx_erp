/**
 * Sincronización Contifico -> DB local del ERP -> Altosa.
 *
 * Uso:
 *   pnpm sync:contifico
 *   pnpm sync:contifico -- --dry-run
 *   pnpm sync:contifico -- --skip-altosa
 *   pnpm sync:contifico -- --only 613
 *   pnpm sync:contifico -- --match-by-name   (migración inicial desde el ETL)
 *   pnpm sync:contifico -- --prune           (desactiva lo que ya no está en Contifico)
 *   pnpm sync:contifico -- --dry-run --match-by-name --prune
 *   pnpm sync:contifico -- --create-missing  (importa TODO Contifico, no recomendado)
 *   pnpm sync:contifico -- --export ../altosa_infrastructure/backend/data/contifico-products.json
 *
 * Por defecto la sincronización SOLO actualiza productos que ya existen en el
 * ERP. Los productos nuevos se agregan a demanda desde el buscador de
 * Contifico del panel de producto. --prune no borra filas: marca
 * isActive=false en la DB local y desactiva los SKUs en Altosa. Úsalo primero
 * con --dry-run.
 */
import 'dotenv/config';
import { disconnectDatabase } from '../src/config/database';
import { isContificoConfigured } from '../src/integrations/contifico/contifico-service';
import { syncContificoCatalog } from '../src/integrations/contifico/contifico-sync';

function readOption(name: string): string | undefined {
  const args = process.argv.slice(2);
  const equalsArg = args.find((arg) => arg.startsWith(`--${name}=`));
  if (equalsArg) {
    return equalsArg.slice(`--${name}=`.length);
  }
  const index = args.indexOf(`--${name}`);
  if (index >= 0) {
    return args[index + 1];
  }
  return undefined;
}

async function main(): Promise<void> {
  if (!isContificoConfigured()) {
    console.error(
      'Falta CONTIFICO_API_KEY en backend/.env. Configura la API key de Contifico antes de sincronizar.'
    );
    process.exitCode = 1;
    return;
  }

  const counters = await syncContificoCatalog({
    dryRun: process.argv.includes('--dry-run'),
    pushToAltosa: !process.argv.includes('--skip-altosa'),
    onlySku: readOption('only'),
    exportPath: readOption('export'),
    matchByName: process.argv.includes('--match-by-name'),
    prune: process.argv.includes('--prune'),
    createMissing: process.argv.includes('--create-missing'),
  });

  console.log(JSON.stringify(counters, null, 2));
  console.log(
    `\nContifico -> ERP: ${counters.products.created} creados, ${counters.products.updated} actualizados, ` +
      `${counters.products.ignored} ignorados (no existen en el ERP), ` +
      `${counters.products.skipped} omitidos, ${counters.products.pruned} desactivados por reconciliación ` +
      `(${counters.products.fetched} leídos).`
  );
  if (counters.altosa.configured) {
    console.log(
      `ERP -> Altosa: ${counters.altosa.pushed} enviados, ${counters.altosa.failed} fallidos, ` +
        `${counters.altosa.deactivatedVariants} variantes y ${counters.altosa.deactivatedProducts} productos desactivados, ` +
        `${counters.altosa.deactivationFailed} SKUs no desactivados.` +
        (counters.altosa.error ? ` Detalle: ${counters.altosa.error}` : '')
    );
  } else {
    console.log('Altosa no está configurado (ALTOSA_API_KEY); se omitió el push.');
  }
  if (counters.dryRun && counters.products.pruned > 0) {
    console.log(
      'Dry-run: no se modificó nada. Si el conteo de desactivados es correcto, ejecuta sin --dry-run.'
    );
  }
  if (counters.prunedSkuSample?.length) {
    console.log(`Muestra de SKUs a desactivar: ${counters.prunedSkuSample.join(', ')}`);
  }
  if (counters.exportedTo) {
    console.log(`Payload de Altosa exportado en: ${counters.exportedTo}`);
  }
  if (
    !counters.dryRun &&
    counters.altosa.configured &&
    (counters.altosa.failed > 0 || counters.altosa.deactivationFailed > 0)
  ) {
    console.error(
      'La sincronización terminó con fallos hacia Altosa. Los productos afectados quedaron ' +
        'SIN_SINCRONIZAR; revisa el log y vuelve a ejecutar el sync (es idempotente).'
    );
    process.exitCode = 1;
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => void disconnectDatabase());
