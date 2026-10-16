import { altosaGet, altosaRequest } from './altosa-client';
import type {
  AltosaActiveQuery,
  AltosaCreateProductBody,
  AltosaDocumentsQuery,
  AltosaProductsQuery,
  AltosaUpdateProductBody,
  AltosaUpdateVariantBody,
  AltosaVariantBody,
} from './altosa-schema';

export async function listProducts(query: AltosaProductsQuery) {
  return altosaGet<unknown[]>('/api/v1/products', {
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    categoryId: query.categoryId,
    subcategoryId: query.subcategoryId,
    active: true,
    withVariants: query.withVariants,
  });
}

export async function getProductById(id: number) {
  return altosaGet<unknown>(`/api/v1/products/${id}`);
}

export async function getProductByVariantSku(sku: string) {
  return altosaGet<unknown>(`/api/v1/products/sku/${encodeURIComponent(sku)}`);
}

export async function listCategories() {
  return altosaGet<unknown>('/api/v1/categories');
}

export async function listCatalogs(query: AltosaActiveQuery) {
  return altosaGet<unknown>('/api/v1/catalogs', { active: query.active });
}

export async function listLocations(query: AltosaActiveQuery) {
  return altosaGet<unknown>('/api/v1/locations', { active: query.active });
}

export async function listWarranties(query: AltosaActiveQuery) {
  return altosaGet<unknown>('/api/v1/warranties', { active: query.active });
}

export async function listDocuments(query: AltosaDocumentsQuery) {
  return altosaGet<unknown[]>('/api/v1/documents', {
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    source: query.source,
    active: true,
    includeContent: query.includeContent,
  });
}

// ---------------------------------------------------------------------------
// Escritura (CRUD a través del API de Altosa)
// ---------------------------------------------------------------------------

export async function createProduct(input: AltosaCreateProductBody) {
  return altosaRequest<unknown>('POST', '/api/v1/products', { body: input });
}

export async function updateProduct(id: number, input: AltosaUpdateProductBody) {
  return altosaRequest<unknown>('PATCH', `/api/v1/products/${id}`, { body: input });
}

export async function deleteProduct(id: number) {
  return altosaRequest<unknown>('DELETE', `/api/v1/products/${id}`);
}

export async function createVariant(productId: number, input: AltosaVariantBody) {
  return altosaRequest<unknown>('POST', `/api/v1/products/${productId}/variants`, {
    body: input,
  });
}

export async function updateVariant(variantId: number, input: AltosaUpdateVariantBody) {
  return altosaRequest<unknown>('PATCH', `/api/v1/variants/${variantId}`, { body: input });
}

export async function deleteVariant(variantId: number) {
  return altosaRequest<unknown>('DELETE', `/api/v1/variants/${variantId}`);
}
