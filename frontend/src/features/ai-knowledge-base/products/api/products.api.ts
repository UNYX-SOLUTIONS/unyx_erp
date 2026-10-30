import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api-types';
import {
  mapAltosaProduct,
  mapAltosaVariant,
  type AltosaProductDto,
  type AltosaVariantDto,
} from './altosa.mappers';
import type {
  CreateProductPayload,
  CreateVariantPayload,
  ContificoCatalogItem,
  ExternalImportResult,
  ExternalPendingItem,
  ExternalPendingResult,
  ExternalSource,
  KommoTemplateDto,
  MetaCatalogItem,
  ProductDetailDto,
  ProductDto,
  ProductListParams,
  UpdateProductPayload,
  UpdateVariantPayload,
  VariantDto,
} from '../types/product.types';

/**
 * Capa de datos de la sección "Productos" de la Base de conocimiento.
 *
 * Los productos viven en la base de datos del cliente (Altosa) y se acceden
 * SIEMPRE a través del backend del ERP (patrón BFF):
 *   frontend -> /api/v1/integrations/altosa/* (ERP) -> altosa-api -> DB Altosa
 * El navegador nunca llama al API de Altosa directamente.
 */
const BASE = '/api/v1/integrations/altosa';
const PAGE_SIZE = 100;

function buildMeta(page: number, limit: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

async function fetchAllProducts(): Promise<AltosaProductDto[]> {
  const all: AltosaProductDto[] = [];
  let page = 1;

  for (;;) {
    const response = await apiClient.get<ApiResponse<AltosaProductDto[]>>(`${BASE}/products`, {
      params: { page, pageSize: PAGE_SIZE, withVariants: 'true', active: 'true' },
    });

    all.push(...response.data.data);

    const totalPages = response.data.meta?.totalPages ?? 1;
    if (page >= totalPages) {
      break;
    }
    page += 1;
  }

  return all;
}

function matchesFilters(product: ProductDto, params: ProductListParams): boolean {
  if (params.validation && product.validation !== params.validation) {
    return false;
  }
  if (params.syncStatus && product.syncStatus !== params.syncStatus) {
    return false;
  }
  if (params.line) {
    const line = params.line.toLowerCase();
    const candidates = [product.line, product.category, product.subcategory]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase());
    if (!candidates.includes(line)) {
      return false;
    }
  }
  if (params.search) {
    const query = params.search.toLowerCase();
    const haystack = [
      product.name,
      product.sku,
      product.category,
      product.subcategory,
      ...product.keywords,
    ]
      .filter((value): value is string => Boolean(value))
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(query)) {
      return false;
    }
  }
  return true;
}

function toProductDetail(dto: AltosaProductDto): ProductDetailDto {
  const productId = String(dto.id);
  return {
    ...mapAltosaProduct(dto),
    variants: (dto.variantes ?? []).map((variante, index) =>
      mapAltosaVariant(variante, productId, index)
    ),
    kommoTemplate: dto.kommoTemplate ?? null,
  };
}

export async function listProducts(params: ProductListParams): Promise<ApiResponse<ProductDto[]>> {
  const products = (await fetchAllProducts()).map(mapAltosaProduct);
  const filtered = products.filter((product) => matchesFilters(product, params));

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const start = (page - 1) * limit;

  return {
    success: true,
    data: filtered.slice(start, start + limit),
    meta: buildMeta(page, limit, filtered.length),
  };
}

export async function getProductById(id: string): Promise<ApiResponse<ProductDetailDto>> {
  const response = await apiClient.get<ApiResponse<AltosaProductDto>>(`${BASE}/products/${id}`);
  return { success: true, data: toProductDetail(response.data.data) };
}

function variantCreateBody(payload: CreateVariantPayload) {
  return {
    sku: payload.sku || undefined,
    color: payload.color || payload.name || undefined,
    descripcion: payload.description || undefined,
    precioUsd: payload.price ?? undefined,
    imagenUrl: payload.imageUrl || undefined,
    kommoTemplateId: payload.kommoTemplateId ?? undefined,
    garantiaId: payload.garantiaId ?? null,
  };
}

function variantUpdateBody(payload: UpdateVariantPayload) {
  const body: Record<string, unknown> = {};
  if (payload.sku !== undefined) {
    body.sku = payload.sku || undefined;
  }
  if (payload.color !== undefined || payload.name !== undefined) {
    body.color = payload.color || payload.name || undefined;
  }
  if (payload.description !== undefined) {
    body.descripcion = payload.description || undefined;
  }
  if (payload.price !== undefined) {
    body.precioUsd = payload.price ?? undefined;
  }
  if (payload.imageUrl !== undefined) {
    body.imagenUrl = payload.imageUrl;
  }
  if (payload.isActive !== undefined) {
    body.isActive = payload.isActive;
  }
  if (payload.kommoTemplateId !== undefined) {
    body.kommoTemplateId = payload.kommoTemplateId;
  }
  if (payload.metaRetailerId !== undefined) {
    body.metaRetailerId = payload.metaRetailerId;
  }
  if (payload.metaMappingLocked !== undefined) {
    body.metaMappingLocked = payload.metaMappingLocked;
  }
  if (payload.contificoId !== undefined) {
    body.contificoId = payload.contificoId;
  }
  if (payload.contificoSku !== undefined) {
    body.contificoSku = payload.contificoSku;
  }
  if (payload.garantiaId !== undefined) {
    body.garantiaId = payload.garantiaId;
  }
  return body;
}

export async function createProduct(
  payload: CreateProductPayload
): Promise<ApiResponse<ProductDetailDto>> {
  const response = await apiClient.post<ApiResponse<AltosaProductDto>>(`${BASE}/products`, {
    sku: payload.sku,
    nombre: payload.name,
    line: payload.line || undefined,
    category: payload.category || undefined,
    subcategory: payload.subcategory || undefined,
    descripcion: payload.commercialDescription || undefined,
    usoRecomendado: payload.description || undefined,
    variantes: (payload.variants ?? []).map(variantCreateBody),
  });

  return { success: true, data: toProductDetail(response.data.data) };
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload
): Promise<ApiResponse<ProductDetailDto>> {
  const body: Record<string, unknown> = {};
  if (payload.sku !== undefined) {
    body.sku = payload.sku;
  }
  if (payload.name !== undefined) {
    body.nombre = payload.name;
  }
  if (payload.line !== undefined) {
    body.line = payload.line || undefined;
  }
  if (payload.category !== undefined) {
    body.category = payload.category || undefined;
  }
  if (payload.subcategory !== undefined) {
    body.subcategory = payload.subcategory || undefined;
  }
  if (payload.commercialDescription !== undefined) {
    body.descripcion = payload.commercialDescription;
  }
  if (payload.description !== undefined) {
    body.usoRecomendado = payload.description;
  }
  if (payload.isActive !== undefined) {
    body.isActive = payload.isActive;
  }

  await apiClient.patch(`${BASE}/products/${id}`, body);
  return getProductById(id);
}

export async function deleteProduct(id: string): Promise<ApiResponse<ProductDto>> {
  const response = await apiClient.delete<ApiResponse<AltosaProductDto>>(`${BASE}/products/${id}`);
  return { success: true, data: mapAltosaProduct(response.data.data) };
}

export async function listVariants(productId: string): Promise<ApiResponse<VariantDto[]>> {
  const detail = await getProductById(productId);
  return { success: true, data: detail.data.variants };
}

export async function addVariant(
  productId: string,
  payload: CreateVariantPayload
): Promise<ApiResponse<VariantDto>> {
  const response = await apiClient.post<ApiResponse<AltosaVariantDto>>(
    `${BASE}/products/${productId}/variants`,
    variantCreateBody(payload)
  );
  return { success: true, data: mapAltosaVariant(response.data.data, productId, 0) };
}

export async function updateVariant(
  productId: string,
  variantId: string,
  payload: UpdateVariantPayload
): Promise<ApiResponse<VariantDto>> {
  const response = await apiClient.patch<ApiResponse<AltosaVariantDto>>(
    `${BASE}/variants/${variantId}`,
    variantUpdateBody(payload),
    { params: { productId } }
  );
  return { success: true, data: mapAltosaVariant(response.data.data, productId, 0) };
}

export async function deleteVariant(
  productId: string,
  variantId: string
): Promise<ApiResponse<VariantDto>> {
  const response = await apiClient.delete<ApiResponse<AltosaVariantDto>>(
    `${BASE}/variants/${variantId}`,
    { params: { productId } }
  );
  return { success: true, data: mapAltosaVariant(response.data.data, productId, 0) };
}

export async function uploadVariantImage(
  file: File
): Promise<ApiResponse<{ url: string; path: string }>> {
  const formData = new FormData();
  formData.append('file', file);
  // Content-Type null para que axios NO serialice el FormData a JSON
  // (el default del apiClient es application/json) y el navegador envíe
  // multipart/form-data con su boundary automáticamente.
  const response = await apiClient.post<ApiResponse<{ url: string; path: string }>>(
    `${BASE}/uploads/variants`,
    formData,
    { headers: { 'Content-Type': null } }
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Contifico: búsqueda e importación a demanda (selector del panel de producto)
// ---------------------------------------------------------------------------

export interface ContificoProductSuggestion {
  contificoId: string;
  sku: string;
  name: string;
  category: string | null;
  price: number | null;
  stock: number;
  imageUrl: string | null;
  barcode: string | null;
  alreadyAdded: boolean;
  localProductId: string | null;
}

export interface ContificoImportResult {
  localProductId: string;
  altosaProductId?: number;
  sku: string;
  name: string;
  created: boolean;
  updated: boolean;
}

export async function searchContificoProducts(
  query: string,
  limit = 8
): Promise<ApiResponse<ContificoProductSuggestion[]>> {
  const response = await apiClient.get<ApiResponse<ContificoProductSuggestion[]>>(
    '/api/v1/integrations/contifico/search',
    { params: { q: query, limit }, timeout: 30_000 }
  );
  return response.data;
}

export async function importContificoProduct(payload: {
  contificoId?: string;
  sku?: string;
}): Promise<ApiResponse<ContificoImportResult>> {
  const response = await apiClient.post<ApiResponse<ContificoImportResult>>(
    '/api/v1/integrations/contifico/import',
    payload,
    { timeout: 60_000 }
  );
  return response.data;
}

export async function searchContificoCatalog(
  search: string,
  limit = 20
): Promise<ApiResponse<ContificoCatalogItem[]>> {
  const response = await apiClient.get<ApiResponse<ContificoCatalogItem[]>>(
    '/api/v1/integrations/contifico/products',
    { params: { search, limit }, timeout: 45_000 }
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Ingesta inversa: ítems planos de Meta/Contifico que faltan en Altosa
// ---------------------------------------------------------------------------

export async function getExternalPending(params: {
  limit?: number;
  search?: string;
  source?: ExternalSource | 'all';
} = {}): Promise<ApiResponse<ExternalPendingResult>> {
  const response = await apiClient.get<ApiResponse<ExternalPendingResult>>(
    `${BASE}/external/pending`,
    {
      params: {
        limit: params.limit ?? 1000,
        ...(params.search ? { search: params.search } : {}),
        source: params.source ?? 'all',
      },
      timeout: 150_000,
    }
  );
  return response.data;
}

export async function importExternalItems(
  items: ExternalPendingItem[]
): Promise<ApiResponse<ExternalImportResult>> {
  const response = await apiClient.post<ApiResponse<ExternalImportResult>>(
    `${BASE}/external/import`,
    { items },
    { timeout: 120_000 }
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Kommo: plantillas de chat
// ---------------------------------------------------------------------------

export interface KommoSyncResult {
  fetched: number;
  created: number;
  updated: number;
  unchanged: number;
  deactivated: number;
}

export async function searchKommoTemplates(
  search?: string,
  limit = 50
): Promise<ApiResponse<KommoTemplateDto[]>> {
  const response = await apiClient.get<ApiResponse<KommoTemplateDto[]>>(
    '/api/v1/integrations/kommo/templates',
    {
      params: {
        ...(search ? { search } : {}),
        limit,
      },
      timeout: 30_000,
    }
  );
  return response.data;
}

export async function syncKommoTemplates(): Promise<ApiResponse<KommoSyncResult>> {
  const response = await apiClient.post<ApiResponse<KommoSyncResult>>(
    '/api/v1/integrations/kommo/sync-templates',
    {},
    { timeout: 120_000 }
  );
  return response.data;
}

// ---------------------------------------------------------------------------
// Meta: catálogo de WhatsApp para el mapeo de variantes
// ---------------------------------------------------------------------------

export async function searchMetaCatalog(
  query: string,
  limit = 20
): Promise<ApiResponse<{ items: MetaCatalogItem[] }>> {
  const response = await apiClient.get<ApiResponse<{ items: MetaCatalogItem[] }>>(
    `${BASE}/meta/catalog/search`,
    {
      params: { q: query, limit },
      timeout: 30_000,
    }
  );
  return response.data;
}

export async function getMetaCatalogItem(
  retailerId: string
): Promise<ApiResponse<MetaCatalogItem>> {
  const response = await apiClient.get<ApiResponse<MetaCatalogItem>>(
    `${BASE}/meta/catalog/item`,
    {
      params: { retailerId },
      timeout: 30_000,
    }
  );
  return response.data;
}
