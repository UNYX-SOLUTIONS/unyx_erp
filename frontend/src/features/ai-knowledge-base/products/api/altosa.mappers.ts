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
  kommoTemplateId?: string | null;
  kommoTemplate?: KommoTemplateDto | null;
  metaRetailerId?: string | null;
  metaMappingLocked?: boolean;
  updatedAt: string;
}

export interface AltosaProductDto {
  id: number;
  nombre: string;
  descripcion: string | null;
  usoRecomendado: string | null;
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
    add(variante.color);
  }
  return Array.from(parts);
}

export function mapAltosaVariant(
  variante: AltosaVariantDto,
  productId: string,
  index: number
): VariantDto {
  const updatedAt = variante.updatedAt;
  return {
    id: String(variante.id),
    productId,
    sku: variante.sku ?? `ALT-${productId}-V${index + 1}`,
    name: variante.color?.trim() || `Variante ${index + 1}`,
    color: variante.color,
    colorHex: null,
    price: variante.precioUsd,
    stock: 0,
    imageUrl: variante.imagenUrl,
    description: variante.descripcion,
    isActive: variante.isActive,
    sortOrder: index,
    kommoTemplateId: variante.kommoTemplateId ?? null,
    kommoTemplate: variante.kommoTemplate ?? null,
    metaRetailerId: variante.metaRetailerId ?? null,
    metaMappingLocked: variante.metaMappingLocked ?? false,
    createdAt: updatedAt,
    updatedAt,
  };
}

export function mapAltosaProduct(product: AltosaProductDto): ProductDto {
  const variantes = product.variantes ?? [];
  const precios = variantes
    .map((variante) => variante.precioUsd)
    .filter((precio): precio is number => precio !== null);

  return {
    id: String(product.id),
    sku: product.variantes?.[0]?.sku ?? `ALT-${product.id}`,
    name: product.nombre,
    line: product.categoria.nombre,
    category: product.categoria.nombre,
    subcategory: product.subcategoria.nombre,
    description: product.usoRecomendado,
    commercialDescription: product.descripcion,
    keywords: buildKeywords(product),
    thumbnailUrl: variantes[0]?.imagenUrl ?? null,
    sourceUrl: variantes[0]?.urlProducto ?? null,
    validation: aggregateValidation([
      product.estado?.estado,
      ...variantes.map((variante) => variante.estado?.estado),
    ]),
    syncStatus: 'SINCRONIZADO',
    isActive: product.isActive,
    variantCount: variantes.length,
    price: precios.length > 0 ? Math.min(...precios) : null,
    priceFrom: variantes.length > 1,
    primaryColor: variantes[0]?.color ?? null,
    variants: variantes.map((variante, index) =>
      mapAltosaVariant(variante, String(product.id), index)
    ),
    kommoTemplateId: product.kommoTemplateId ?? null,
    createdAt: product.updatedAt,
    updatedAt: product.updatedAt,
  };
}
