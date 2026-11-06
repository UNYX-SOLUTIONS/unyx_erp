import type {
  KbValidationStatus,
  KommoTemplateDto,
  ProductDto,
  VariantDto,
} from '../types/product.types';

export interface AltosaEstadoDto {
  id: number;
  estado: string;
  permiteRag: boolean;
}

export interface AltosaGarantiaDto {
  id: number;
  meses: number | null;
  especial: string | null;
  observaciones: string | null;
}

export interface AltosaCatalogoDto {
  id: number;
  keyword: string | null;
  archivo: string | null;
  driveUrl: string | null;
  paginas: number | null;
}

export interface AltosaVariantDto {
  id: number;
  sku: string | null;
  nombre?: string | null;
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
  especificaciones?: { stock?: number | string; [key: string]: unknown } | null;
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
  kommoTemplateId?: string | null;
  kommoTemplate?: KommoTemplateDto | null;
  metaRetailerId?: string | null;
  metaMappingLocked?: boolean;
  contificoId?: string | null;
  contificoSku?: string | null;
  updatedAt: string;
}

export interface AltosaProductDto {
  id: number;
  nombre: string;
  descripcion: string | null;
  usoRecomendado: string | null;
  keywords?: string[] | null;
  categoria: { id: number; nombre: string };
  subcategoria: { id: number; nombre: string };
  estado: AltosaEstadoDto;
  isActive: boolean;
  kommoTemplateId?: string | null;
  kommoTemplate?: KommoTemplateDto | null;
  updatedAt: string;
  variantes?: AltosaVariantDto[];
}

function normalizeValidation(value: string | null | undefined): KbValidationStatus {
  const text = (value ?? '').toLowerCase();
  if (text.includes('inactiv') || text.includes('anulad')) {
    return 'PENDIENTE';
  }
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

function aggregateValidation(estados: Array<string | null | undefined>): KbValidationStatus {
  const statuses = estados.map((estado) => normalizeValidation(estado));
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
  for (const variante of product.variantes ?? []) {
    add(variante.nombre);
    add(variante.color);
  }
  return Array.from(parts);
}

function parseAdditionalSpecs(
  raw: string | null | undefined
): Record<string, unknown> {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function mapAltosaVariant(
  variante: AltosaVariantDto,
  productId: string,
  index: number
): VariantDto {
  const updatedAt = variante.updatedAt;
  const specs =
    variante.especificaciones ??
    parseAdditionalSpecs(variante.especificacionesAdicionales);
  const rawStock = specs.stock;
  const stock = typeof rawStock === 'number' ? rawStock : Number(rawStock ?? 0) || 0;
  return {
    id: String(variante.id),
    productId,
    sku: variante.sku ?? `ALT-${productId}-V${index + 1}`,
    name:
      variante.nombre?.trim() ||
      variante.color?.trim() ||
      `Variante ${index + 1}`,
    color: variante.color,
    colorHex: null,
    price: variante.precioUsd,
    stock,
    imageUrl: variante.imagenUrl,
    description: variante.descripcion,
    isActive: variante.isActive,
    estadoId: variante.estado?.id ?? (variante.isActive ? 1 : 2),
    sortOrder: index,
    kommoTemplateId: variante.kommoTemplateId ?? null,
    kommoTemplate: variante.kommoTemplate ?? null,
    metaRetailerId: variante.metaRetailerId ?? null,
    metaMappingLocked: variante.metaMappingLocked ?? false,
    contificoId: variante.contificoId ?? null,
    contificoSku: variante.contificoSku ?? null,
    garantiaId: variante.garantia?.id ?? null,
    createdAt: updatedAt,
    updatedAt,
  };
}

export function mapAltosaProduct(product: AltosaProductDto): ProductDto {
  const variantes = product.variantes ?? [];
  const activeVariants = variantes.filter((variante) => variante.isActive);
  const pricingVariants = activeVariants.length > 0 ? activeVariants : variantes;
  const allExternallyMapped =
    activeVariants.length > 0 &&
    activeVariants.every((variante) =>
      Boolean(variante.contificoId || variante.metaRetailerId)
    );
  const precios = pricingVariants
    .map((variante) => variante.precioUsd)
    .filter((precio): precio is number => precio !== null);

  return {
    id: String(product.id),
    sku: product.variantes?.[0]?.sku ?? `ALT-${product.id}`,
    name: product.nombre,
    line: product.categoria.nombre,
    category: product.categoria.nombre,
    subcategory: product.subcategoria.nombre,
    categoryId: product.categoria.id,
    subcategoryId: product.subcategoria.id,
    description: product.usoRecomendado,
    commercialDescription: product.descripcion,
    keywords: product.keywords ?? buildKeywords(product),
    thumbnailUrl:
      variantes.find((variante) => Boolean(variante.imagenUrl?.trim()))
        ?.imagenUrl ?? null,
    sourceUrl: variantes[0]?.urlProducto ?? null,
    validation: aggregateValidation([
      product.estado?.estado,
      ...variantes.map((variante) => variante.estado?.estado),
    ]),
    syncStatus: allExternallyMapped ? 'SINCRONIZADO' : 'SIN_SINCRONIZAR',
    isActive: product.isActive,
    estadoId: product.estado?.id ?? (product.isActive ? 1 : 2),
    variantCount: variantes.length,
    price: precios.length > 0 ? Math.min(...precios) : null,
    priceFrom: pricingVariants.length > 1,
    primaryColor: pricingVariants[0]?.color ?? null,
    variants: variantes.map((variante, index) =>
      mapAltosaVariant(variante, String(product.id), index)
    ),
    kommoTemplateId: product.kommoTemplateId ?? null,
    createdAt: product.updatedAt,
    updatedAt: product.updatedAt,
  };
}
