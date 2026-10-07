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

const missingRequired = REQUIRED_PATHS.filter((path) => !existsSync(path));
const brokenPackages = findBrokenPackages();

if (missingRequired.length === 0 && brokenPackages.length === 0) {
  process.exit(0);
}

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
console.log('[ensure-deps] Dependencias restauradas correctamente.');
