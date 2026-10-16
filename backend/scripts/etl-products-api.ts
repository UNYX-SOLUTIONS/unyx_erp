/**
 * ETL de productos: Altosa (API interna) -> Base de conocimiento del ERP.
 *
 * Reemplaza la conexión directa del ERP a la DB del cliente (client-altosa).
 * Fuente: GET {ALTOSA_API_URL}/api/v1/products?withVariants=true (paginado).
 *
 * Uso:
 *   pnpm etl:products:api            # sincroniza creando/actualizando faltantes
 *   pnpm etl:products:api -- --dry-run
 *   pnpm etl:products:api -- --force # sobreescribe registros existentes
 */
import 'dotenv/config';
import { PrismaClient, type KbSyncStatus, type KbValidationStatus, type Prisma } from '@prisma/client';
import { altosaGet } from '../src/integrations/altosa/altosa-client';
import type { PaginationMeta } from '../src/utils/pagination';

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const DEFAULT_COMPANY_TAX_ID = '0000000000001';
const PAGE_SIZE = 100;

interface AltosaEstadoDto {
  id: number;
  estado: string;
  permiteRag: boolean;
}

interface AltosaGarantiaDto {
  id: number;
  meses: number | null;
  especial: string | null;
  observaciones: string | null;
}

interface AltosaCatalogoDto {
  id: number;
  keyword: string | null;
  archivo: string | null;
  driveUrl: string | null;
  paginas: number | null;
}

interface AltosaVariantDto {
  id: number;
  sku: string | null;
  color: string | null;
  descripcion: string | null;
  precioUsd: number | null;
  imagenUrl: string | null;
  urlProducto: string | null;
  material: string | null;
  tapizado: string | null;
  estructura: string | null;
  usoRecomendado: string | null;
  especificacionesAdicionales: string | null;
  apilable: string | null;
  proteccionUv: string | null;
  resistenciaIntemperie: string | null;
  soporteLumbar: string | null;
  brazos: string | null;
  cabecera: string | null;
  mecanismo: string | null;
  medidas: {
    anchoTotalCm: number | null;
    profundidadAsientoCm: number | null;
    alturaTotalCm: string | null;
    alturaAsientoCm: string | null;
    anchoAsientoCm: number | null;
    pesoKg: number | null;
  };
  garantia: AltosaGarantiaDto | null;
  catalogo: AltosaCatalogoDto | null;
  estado: AltosaEstadoDto;
  isActive: boolean;
}

interface AltosaProductDto {
  id: number;
  nombre: string;
  descripcion: string | null;
  usoRecomendado: string | null;
  categoria: { id: number; nombre: string };
  subcategoria: { id: number; nombre: string };
  estado: AltosaEstadoDto;
  isActive: boolean;
  variantes: AltosaVariantDto[];
}

function normalizeValidation(value: string | null | undefined): KbValidationStatus {
  const text = (value ?? '').toLowerCase();
  if (text.includes('activo') || text.includes('aprob')) {
    return 'APROBADO';
  }
  if (text.includes('correc') || text.includes('incomplet')) {
    return 'REQUIERE_CORRECCION';
  }
  if (text.includes('sin precio') || text.includes('sin_precio')) {
    return 'SIN_PRECIO';
  }
  return 'PENDIENTE';
}

function aggregateValidation(states: Array<string | null | undefined>): KbValidationStatus {
  const statuses = states.map((state) => normalizeValidation(state));
  if (statuses.includes('REQUIERE_CORRECCION')) {
    return 'REQUIERE_CORRECCION';
  }
  if (statuses.includes('PENDIENTE')) {
    return 'PENDIENTE';
  }
  if (statuses.includes('SIN_PRECIO')) {
    return 'SIN_PRECIO';
  }
  return 'APROBADO';
}

function buildKeywords(product: AltosaProductDto): string[] {
  const parts = new Set<string>();
  const add = (value: string | null | undefined) => {
    if (value && value.trim().length > 0) {
      parts.add(value.trim());
    }
  };
  add(product.nombre);
  add(product.categoria.nombre);
  add(product.subcategoria.nombre);
  add(product.usoRecomendado);
  for (const variante of product.variantes) {
    add(variante.color);
    add(variante.usoRecomendado);
  }
  return Array.from(parts);
}

function buildSpecs(variant: AltosaVariantDto): Prisma.InputJsonValue | undefined {
  const entries: Record<string, string | number> = {};

  const numeric: Array<[string, number | null]> = [
    ['ancho_total_cm', variant.medidas.anchoTotalCm],
    ['profundidad_asiento_cm', variant.medidas.profundidadAsientoCm],
    ['ancho_asiento_cm', variant.medidas.anchoAsientoCm],
    ['peso_kg', variant.medidas.pesoKg],
    ['garantia_meses', variant.garantia?.meses ?? null],
  ];
  for (const [key, value] of numeric) {
    if (value !== null && value !== undefined) {
      entries[key] = value;
    }
  }

  const texts: Array<[string, string | null | undefined]> = [
    ['altura_total_cm', variant.medidas.alturaTotalCm],
    ['altura_asiento_cm', variant.medidas.alturaAsientoCm],
    ['material', variant.material],
    ['tapizado', variant.tapizado],
    ['estructura', variant.estructura],
    ['mecanismo', variant.mecanismo],
    ['proteccion_uv', variant.proteccionUv],
    ['resistencia_intemperie', variant.resistenciaIntemperie],
    ['apilable', variant.apilable],
    ['brazos', variant.brazos],
    ['soporte_lumbar', variant.soporteLumbar],
    ['cabecera', variant.cabecera],
    ['uso_recomendado', variant.usoRecomendado],
    ['especificaciones_adicionales', variant.especificacionesAdicionales],
    ['garantia_especial', variant.garantia?.especial],
    ['garantia_observaciones', variant.garantia?.observaciones],
    ['catalogo_keyword', variant.catalogo?.keyword],
    ['catalogo_drive_url', variant.catalogo?.driveUrl],
    ['imagen_url', variant.imagenUrl],
    ['url_producto', variant.urlProducto],
  ];
  for (const [key, value] of texts) {
    if (value !== null && value !== undefined && value.trim().length > 0) {
      entries[key] = value.trim();
    }
  }

  return Object.keys(entries).length > 0 ? entries : undefined;
}

async function fetchAllProducts(): Promise<AltosaProductDto[]> {
  const all: AltosaProductDto[] = [];
  let page = 1;

  for (;;) {
    const { data, meta } = await altosaGet<AltosaProductDto[]>('/api/v1/products', {
      page,
      pageSize: PAGE_SIZE,
      active: true,
      withVariants: true,
    });

    all.push(...data);

    const totalPages = (meta as PaginationMeta | undefined)?.totalPages ?? 1;
    if (page >= totalPages) {
      break;
    }
    page += 1;
  }

  return all;
}

async function resolveCompanyId(): Promise<string> {
  const company =
    (await prisma.company.findUnique({ where: { taxId: DEFAULT_COMPANY_TAX_ID } })) ??
    (await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } }));
  if (!company) {
    throw new Error('No hay empresa configurada. Corre primero: pnpm prisma:seed');
  }
  return company.id;
}

interface EtlCounters {
  parentsCreated: number;
  parentsUpdated: number;
  parentsSkipped: number;
  variantsCreated: number;
  variantsUpdated: number;
  variantsSkipped: number;
  productsWithoutVariants: number;
}

async function runEtl(): Promise<void> {
  const companyId = await resolveCompanyId();

  let products: AltosaProductDto[];
  try {
    products = await fetchAllProducts();
  } catch (error) {
    throw new Error(
      `No se pudo leer el catálogo desde el API de Altosa (${process.env.ALTOSA_API_URL ?? 'sin ALTOSA_API_URL'}). ` +
        `Verifica ALTOSA_API_URL/ALTOSA_API_KEY y que altosa-api esté arriba. Detalle: ${
          error instanceof Error ? error.message : String(error)
        }`
    );
  }

  const counters: EtlCounters = {
    parentsCreated: 0,
    parentsUpdated: 0,
    parentsSkipped: 0,
    variantsCreated: 0,
    variantsUpdated: 0,
    variantsSkipped: 0,
    productsWithoutVariants: 0,
  };

  const usedVariantSkus = new Set<string>();

  for (const product of products) {
    const parentSku = `ALT-${product.id}`;

    if (product.variantes.length === 0) {
      counters.productsWithoutVariants += 1;
    }

    const parentData = {
      name: product.nombre,
      line: product.categoria.nombre,
      category: product.categoria.nombre,
      subcategory: product.subcategoria.nombre,
      description: product.usoRecomendado ?? null,
      commercialDescription: product.descripcion ?? null,
      keywords: buildKeywords(product),
      sourceUrl: null,
      validation: aggregateValidation([
        product.estado?.estado,
        ...product.variantes.map((variante) => variante.estado?.estado),
      ]),
      syncStatus: 'SINCRONIZADO' as KbSyncStatus,
      isActive: product.isActive,
      sourceRowKey: null,
      lastSyncedAt: new Date(),
    };

    const existingParent = await prisma.kbProduct.findUnique({
      where: { companyId_sku: { companyId, sku: parentSku } },
    });

    let parentId: string | null = existingParent?.id ?? null;

    if (!existingParent) {
      counters.parentsCreated += 1;
      if (!DRY_RUN) {
        const created = await prisma.kbProduct.create({
          data: { companyId, sku: parentSku, ...parentData },
        });
        parentId = created.id;
      }
    } else if (FORCE) {
      counters.parentsUpdated += 1;
      if (!DRY_RUN && parentId) {
        await prisma.kbProduct.update({ where: { id: parentId }, data: parentData });
      }
    } else {
      counters.parentsSkipped += 1;
    }

    let variantIndex = 0;
    for (const variante of product.variantes) {
      variantIndex += 1;
      let variantSku = (variante.sku ?? '').trim() || `${parentSku}-V${variantIndex}`;
      if (usedVariantSkus.has(variantSku)) {
        variantSku = `${variantSku}-${variantIndex}`;
      }
      usedVariantSkus.add(variantSku);

      const variantData = {
        name: (variante.color ?? '').trim() || `Variante ${variantIndex}`,
        color: variante.color,
        price: variante.precioUsd,
        sortOrder: variantIndex - 1,
        sourceRowKey: null,
        especificaciones: buildSpecs(variante),
      };

      const existingVariant = await prisma.kbProductVariant.findUnique({
        where: { sku: variantSku },
      });

      if (!existingVariant) {
        counters.variantsCreated += 1;
        if (!DRY_RUN && parentId) {
          await prisma.kbProductVariant.create({
            data: { productId: parentId, sku: variantSku, ...variantData },
          });
        }
      } else if (FORCE) {
        counters.variantsUpdated += 1;
        if (!DRY_RUN) {
          await prisma.kbProductVariant.update({
            where: { id: existingVariant.id },
            data: variantData,
          });
        }
      } else {
        counters.variantsSkipped += 1;
      }
    }
  }

  const prefix = DRY_RUN ? '[dry-run] ' : '';
  console.log(
    `${prefix}ETL (vía API de Altosa) completado:\n` +
      `  Productos leídos del API: ${products.length} (${counters.productsWithoutVariants} sin variantes)\n` +
      `  Productos padre: ${counters.parentsCreated} creados, ${counters.parentsUpdated} actualizados, ${counters.parentsSkipped} sin cambios\n` +
      `  Variantes: ${counters.variantsCreated} creadas, ${counters.variantsUpdated} actualizadas, ${counters.variantsSkipped} sin cambios` +
      (FORCE ? '\n  Modo --force: los registros existentes fueron sobreescritos' : '')
  );
}

runEtl()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
