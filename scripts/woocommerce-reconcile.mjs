#!/usr/bin/env node
/**
 * Reconciliación WooCommerce -> Altosa.
 *
 * - Lee el export de WooCommerce (`woo_commerce/productos_woocommerce.json`).
 * - Cruza cada producto contra Altosa por `WC-<id de Woo>` (meta_retailer_id),
 *   luego por slug y nombre.
 * - Reporta los que faltan y los candidatos duplicados.
 * - Con `--apply` crea en Altosa los faltantes (subcategoría Catálogo Meta),
 *   con una variante, `meta_retailer_id=WC-<id>`, precio, imagen, URL y stock.
 * - Es idempotente: al volver a correrlo, los creados se reconocen por meta ID.
 *
 * Uso:
 *   node scripts/woocommerce-reconcile.mjs                 # dry-run + reporte
 *   node scripts/woocommerce-reconcile.mjs --apply         # crea faltantes
 *   node scripts/woocommerce-reconcile.mjs --file ruta.json --apply
 *
 * Requiere ALTOSA_API_URL y ALTOSA_API_KEY en `.env.production`/`.env` o en el entorno.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DEFAULT_FILE = path.join(ROOT, 'woo_commerce', 'productos_woocommerce.json');
const DEFAULT_REPORT = path.join(ROOT, 'data', 'woocommerce-reconcile.csv');
const DEFAULT_SUMMARY = path.join(ROOT, 'data', 'woocommerce-reconcile-summary.json');

function readOption(name) {
  const args = process.argv.slice(2);
  const prefix = `--${name}=`;
  const withEquals = args.find((arg) => arg.startsWith(prefix));
  if (withEquals) return withEquals.slice(prefix.length);
  const index = args.indexOf(`--${name}`);
  if (index >= 0) return args[index + 1] ?? null;
  return null;
}

function loadEnv() {
  const envPath =
    readOption('env') ??
    (fs.existsSync(path.join(ROOT, '.env.production'))
      ? path.join(ROOT, '.env.production')
      : path.join(ROOT, '.env'));
  const env = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match) env[match[1]] = match[2];
    }
  }
  return {
    apiUrl: (process.env.ALTOSA_API_URL ?? env.ALTOSA_API_URL ?? '').replace(/\/+$/, ''),
    apiKey: process.env.ALTOSA_API_KEY ?? env.ALTOSA_API_KEY ?? '',
  };
}

const env = loadEnv();
if (!env.apiUrl || !env.apiKey) {
  console.error(
    'ERROR: faltan ALTOSA_API_URL/ALTOSA_API_KEY. Defínelos en el entorno o en .env.production.'
  );
  process.exit(1);
}

const file = readOption('file') ?? DEFAULT_FILE;
const reportPath = readOption('report') ?? DEFAULT_REPORT;
const summaryPath = readOption('summary') ?? DEFAULT_SUMMARY;
const apply = process.argv.includes('--apply');
const subcategoryId = Number(readOption('subcategory-id') ?? 41);
const estadoId = Number(readOption('estado-id') ?? 1);
const limitRaw = readOption('limit');
const limit = limitRaw ? Number(limitRaw) : null;

const normalize = (value) => String(value ?? '').trim().toLowerCase();
const loose = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

function slugOf(url) {
  if (!url) return '';
  const path = String(url).split('?')[0].split('#')[0].replace(/\/+$/, '');
  return normalize(path.split('/').filter(Boolean).pop() ?? '');
}

function cleanText(value) {
  return String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value, max) {
  return value.length > max ? value.slice(0, max).trim() : value;
}

function metaValue(product, key) {
  const entry = (product.meta_data ?? []).find((item) => item.key === key);
  return String(entry?.value ?? '').trim();
}

function wooRetailerId(product) {
  return `WC-${product.id}`;
}

function wooStock(product) {
  const quantity = Number(product.stock_quantity);
  if (product.stock_quantity !== null && Number.isFinite(quantity)) {
    return Math.max(0, quantity);
  }
  return product.stock_status === 'instock' ? 1 : 0;
}

function wooPrice(product) {
  const raw = product.price || product.regular_price;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function wooImage(product) {
  const src = product.images?.[0]?.src ?? '';
  return /^https?:\/\//i.test(src) ? src : null;
}

function wooUrl(product) {
  const url = product.permalink ?? '';
  return /^https?:\/\//i.test(url) ? url : null;
}

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

async function api(pathname, { method = 'GET', body } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${env.apiUrl}${pathname}`, {
        method,
        headers: {
          'x-api-key': env.apiKey,
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(120000),
      });
      const text = await response.text();
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
      if (!response.ok || !parsed?.success) {
        const message =
          parsed?.message ?? `HTTP ${response.status}: ${text.slice(0, 300)}`;
        if ((response.status === 429 || response.status >= 500) && attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw new Error(message);
      }
      return parsed.data;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  throw lastError;
}

const woo = JSON.parse(fs.readFileSync(file, 'utf8'));
const products = (woo.productos ?? []).slice(
  0,
  limit && Number.isFinite(limit) && limit > 0 ? limit : undefined
);

console.log(`WooCommerce: ${products.length} productos (${file})`);
console.log(`Altosa: ${env.apiUrl}`);
console.log(`Modo: ${apply ? 'APPLY (escribe)' : 'DRY-RUN (solo reporte)'}`);

const links = (await api('/api/v1/external/links')).items ?? [];
const byMeta = new Map();
const bySlug = new Map();
const byName = new Map();
const byProductName = new Map();
const usedSkus = new Set();
for (const link of links) {
  if (link.metaRetailerId) byMeta.set(normalize(link.metaRetailerId), link);
  const slug = slugOf(link.urlProducto);
  if (slug) bySlug.set(slug, link);
  const nameKey = loose(
    link.nombre || `${link.producto?.producto ?? ''} ${link.color ?? ''}`
  );
  if (nameKey) byName.set(nameKey, link);
  const productKey = loose(link.producto?.producto);
  if (productKey) byProductName.set(productKey, link);
  if (link.sku) usedSkus.add(normalize(link.sku));
}

const rows = [];
for (const product of products) {
  const retailerId = wooRetailerId(product);
  const slug = slugOf(product.permalink || product.slug);
  const nameKey = loose(product.name);
  let match = byMeta.get(normalize(retailerId)) ?? null;
  let via = match ? 'metaId' : null;
  if (!match && slug && bySlug.has(slug)) {
    match = bySlug.get(slug);
    via = 'slug';
  }
  if (!match && byName.has(nameKey)) {
    match = byName.get(nameKey);
    via = 'name';
  }
  if (!match && byProductName.has(nameKey)) {
    match = byProductName.get(nameKey);
    via = 'productName';
  }

  let action = 'create';
  let note = '';
  if (match) {
    if (!match.metaRetailerId) {
      action = 'matched_no_meta';
      note =
        'Variante existente sin meta_retailer_id. Se deja así; el feed la publica con ID estable.';
    } else if (normalize(match.metaRetailerId) === normalize(retailerId)) {
      action = 'matched';
    } else {
      action = 'duplicate_candidate';
      note = `Ya existe "${match.nombre ?? match.producto?.producto}" con meta ID ${match.metaRetailerId}; no se crea otro.`;
    }
  }

  rows.push({
    wooId: product.id,
    retailerId,
    name: product.name,
    action,
    matchedVia: via ?? '',
    sku: match?.sku ?? '',
    altosaVariantId: match?.idVariante ?? '',
    altosaProductId: match?.idProducto ?? '',
    altosaProduct: match?.producto?.producto ?? '',
    altosaVariant: match?.nombre ?? '',
    altosaMetaRetailerId: match?.metaRetailerId ?? '',
    price: product.price,
    stock: wooStock(product),
    image: wooImage(product) ?? '',
    url: wooUrl(product) ?? '',
    note,
  });
}

const counts = {};
for (const row of rows) counts[row.action] = (counts[row.action] ?? 0) + 1;

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
const headers = Object.keys(rows[0] ?? {});
const csv = [
  headers.join(';'),
  ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(';')),
].join('\r\n');
fs.writeFileSync(reportPath, `\uFEFF${csv}\r\n`, 'utf8');

const summary = {
  checkedAt: new Date().toISOString(),
  apply,
  file,
  wooProducts: products.length,
  altosaVariants: links.length,
  counts,
  subcategoryId,
  estadoId,
  samples: {
    create: rows.filter((row) => row.action === 'create').slice(0, 50),
    duplicateCandidate: rows
      .filter((row) => row.action === 'duplicate_candidate')
      .slice(0, 50),
    matchedNoMeta: rows
      .filter((row) => row.action === 'matched_no_meta')
      .slice(0, 50),
  },
};
fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({ counts, reportPath, summaryPath }, null, 2));

if (!apply) {
  console.log('DRY-RUN: no se escribió nada en Altosa. Usa --apply para crear los faltantes.');
  process.exit(0);
}

let created = 0;
let createdWithoutMeta = 0;
const errors = [];

for (const row of rows) {
  const product = products.find((item) => item.id === row.wooId);
  if (!product || row.action !== 'create') continue;

  const skuBase = `WC-${product.id}`;
  const sku = usedSkus.has(normalize(skuBase)) ? `WOO-${product.id}` : skuBase;
  const title = truncate(cleanText(product.name), 200);
  const description = truncate(
    cleanText(product.description) || cleanText(product.short_description) || title,
    2000
  );
  const shortDescription = truncate(cleanText(product.short_description), 500);
  const price = wooPrice(product);
  const stock = wooStock(product);
  const image = wooImage(product);
  const url = wooUrl(product);
  const color = metaValue(product, 'fb_color');

  const variantBase = {
    sku,
    nombre: truncate(title, 300),
    ...(color ? { color } : {}),
    descripcion: description,
    ...(price !== null ? { precioUsd: price } : {}),
    ...(image ? { imagenUrl: image } : {}),
    ...(url ? { urlProducto: url } : {}),
    especificacionesAdicionales: JSON.stringify({
      stock,
      source: 'woocommerce',
      wooId: product.id,
      wooRetailerId: row.retailerId,
    }),
  };
  const createBody = (variant) => ({
    nombre: title,
    descripcion: description,
    ...(shortDescription ? { usoRecomendado: shortDescription } : {}),
    subcategoryId,
    estadoId,
    variantes: [variant],
    writeThroughMeta: false,
    writeThroughContifico: false,
  });

  try {
    await api('/api/v1/products', {
      method: 'POST',
      body: createBody({
        ...variantBase,
        metaRetailerId: row.retailerId,
        metaMappingLocked: true,
      }),
    });
    usedSkus.add(normalize(sku));
    created += 1;
    console.log(`Creado ${row.retailerId} - ${title}`);
  } catch (error) {
    const message = String(error);
    if (message.includes('no existe en el catálogo de Meta')) {
      // El producto aún no existe en Meta: se crea sin meta_retailer_id.
      // El feed lo publica con su SKU estable (WC-<id>) y luego se puede mapear.
      try {
        await api('/api/v1/products', {
          method: 'POST',
          body: createBody(variantBase),
        });
        usedSkus.add(normalize(sku));
        createdWithoutMeta += 1;
        console.log(
          `Creado ${row.retailerId} sin meta ID (aún no existe en Meta) - ${title}`
        );
        continue;
      } catch (fallbackError) {
        errors.push({
          retailerId: row.retailerId,
          action: 'create_without_meta',
          error: String(fallbackError),
        });
        console.error(`ERROR ${row.retailerId}: ${String(fallbackError)}`);
        continue;
      }
    }
    errors.push({ retailerId: row.retailerId, action: 'create', error: message });
    console.error(`ERROR ${row.retailerId}: ${message}`);
  }
}

const finalSummary = {
  ...summary,
  applied: true,
  created,
  createdWithoutMeta,
  errors,
};
fs.writeFileSync(summaryPath, `${JSON.stringify(finalSummary, null, 2)}\n`, 'utf8');
console.log(
  JSON.stringify(
    { created, createdWithoutMeta, errors: errors.length, summaryPath },
    null,
    2
  )
);
if (errors.length > 0) process.exitCode = 1;
