import { execSync } from 'node:child_process';
import { existsSync, readdirSync, realpathSync, rmSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

const REQUIRED_PATHS = [
  'frontend/node_modules/next/package.json',
  'frontend/node_modules/next/dist/pages/_app.js',
  'frontend/node_modules/next/dist/compiled/jest-worker/processChild.js',
  'frontend/node_modules/react/package.json',
  'frontend/node_modules/react-dom/package.json',
  'backend/node_modules/@prisma/client/package.json',
  'backend/node_modules/express/package.json',
];

function isDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function removeBrokenStoreEntry(requiredPath) {
  const [workspace, , pkgName] = requiredPath.split('/');
  const linkPath = join(workspace, 'node_modules', pkgName);
  let real;
  try {
    real = realpathSync(linkPath);
  } catch {
    return;
  }
  const parts = real.split(sep);
  const pnpmIndex = parts.indexOf('.pnpm');
  if (pnpmIndex === -1) {
    return;
  }
  const storeEntry = parts.slice(0, pnpmIndex + 2).join(sep);
  try {
    rmSync(storeEntry, { recursive: true, force: true });
    console.log(`    · eliminado paquete roto: ${storeEntry}`);
  } catch (error) {
    console.warn(`    · no se pudo eliminar ${storeEntry}: ${error.message}`);
  }
}

function collectEmptyPayloads(dir, broken) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  if (entries.length === 0) {
    broken.push(dir);
    return;
  }
  for (const child of readdirSync(dir, { withFileTypes: true })) {
    if (!child.isDirectory()) {
      continue;
    }
    const childPath = join(dir, child.name);
    try {
      if (readdirSync(childPath).length === 0) {
        broken.push(childPath);
      }
    } catch {
      continue;
    }
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
      collectEmptyPayloads(payloadPath, broken);
    }
  }
  return broken;
}

const missingRequired = REQUIRED_PATHS.filter((path) => !existsSync(path));
const brokenPackages = findBrokenPackages();

if (missingRequired.length === 0 && brokenPackages.length === 0) {
  process.exit(0);
}

if (missingRequired.length > 0) {
  console.log('[ensure-deps] node_modules incompleto detectado:');
  for (const path of missingRequired) {
    console.log(`  - falta: ${path}`);
    removeBrokenStoreEntry(path);
  }
}

if (brokenPackages.length > 0) {
  console.log(`  - ${brokenPackages.length} paquete(s) vacío(s) en node_modules/.pnpm:`);
  for (const path of brokenPackages) {
    console.log(`    · ${path}`);
    try {
      rmSync(path, { recursive: true, force: true });
    } catch (error) {
      console.warn(`    · no se pudo eliminar ${path}: ${error.message}`);
    }
  }
}

const extraArgs = process.env.CI === 'true' ? '--frozen-lockfile' : '';
console.log(`[ensure-deps] Restaurando dependencias con "pnpm install ${extraArgs}"...`);
execSync(`pnpm install ${extraArgs}`.trim(), { stdio: 'inherit' });
console.log('[ensure-deps] Dependencias restauradas correctamente.');
