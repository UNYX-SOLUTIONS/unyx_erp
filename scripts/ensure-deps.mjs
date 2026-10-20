import { execSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const REQUIRED_PATHS = [
  'frontend/node_modules/next/package.json',
  'frontend/node_modules/next/dist/pages/_app.js',
  'frontend/node_modules/react/package.json',
  'frontend/node_modules/react-dom/package.json',
  'backend/node_modules/@prisma/client/package.json',
  'backend/node_modules/express/package.json',
];

// Next dev en Windows falla con EPERM si quedó un `.next/standalone` de un
// build previo (contiene node_modules enlazados que bloquean el borrado de
// `.next`). Best-effort: se elimina antes de dev/build; los builds lo regeneran.
function cleanStaleNextStandalone() {
  const standalone = 'frontend/.next/standalone';
  if (!existsSync(standalone)) {
    return;
  }
  try {
    rmSync(standalone, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    console.log('[ensure-deps] Limpiado frontend/.next/standalone (residuo de un build previo)');
  } catch (error) {
    console.warn(`[ensure-deps] No se pudo limpiar frontend/.next/standalone: ${error.message}`);
    console.warn('[ensure-deps] Si next dev falla con EPERM, renombra o elimina frontend/.next manualmente.');
  }
}

cleanStaleNextStandalone();

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function findBrokenPackages() {
  const broken = [];
  const virtualStore = 'node_modules/.pnpm';
  if (!existsSync(virtualStore)) {
    return broken;
  }
  for (const entry of readdirSync(virtualStore, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'node_modules') {
      continue;
    }
    const modulesDir = join(virtualStore, entry.name, 'node_modules');
    if (!isDirectory(modulesDir)) {
      continue;
    }
    for (const pkg of readdirSync(modulesDir, { withFileTypes: true })) {
      const payloadPath = join(modulesDir, pkg.name);
      if (!isDirectory(payloadPath)) {
        continue;
      }
      try {
        if (readdirSync(payloadPath).length === 0) {
          broken.push(payloadPath);
        }
      } catch {
        continue;
      }
    }
  }
  return broken;
}

function isPrismaClientGenerated() {
  const virtualStore = 'node_modules/.pnpm';
  if (!existsSync(virtualStore)) {
    return false;
  }
  for (const entry of readdirSync(virtualStore)) {
    if (entry.startsWith('@prisma+client@')) {
      const generatedPath = join(virtualStore, entry, 'node_modules', '.prisma', 'client', 'default.js');
      if (existsSync(generatedPath)) {
        return true;
      }
    }
  }
  return false;
}

const missingRequired = REQUIRED_PATHS.filter((path) => !existsSync(path));
const brokenPackages = findBrokenPackages();

if (missingRequired.length > 0 || brokenPackages.length > 0) {
  console.log('[ensure-deps] node_modules incompleto detectado:');
  for (const path of missingRequired) {
    console.log(`  - falta: ${path}`);
  }
  if (brokenPackages.length > 0) {
    console.log(`  - ${brokenPackages.length} paquete(s) vacío(s) en node_modules/.pnpm:`);
    for (const path of brokenPackages) {
      console.log(`    · ${path}`);
      rmSync(path, { recursive: true, force: true });
    }
  }
  console.log('[ensure-deps] Restaurando dependencias con "pnpm install"...');
  execSync('pnpm install', { stdio: 'inherit' });
}

if (!isPrismaClientGenerated()) {
  console.log('[ensure-deps] Prisma Client no generado. Ejecutando "pnpm db:generate"...');
  execSync('pnpm db:generate', { stdio: 'inherit' });
}
