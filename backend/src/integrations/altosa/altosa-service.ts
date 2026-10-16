import { altosaGet } from './altosa-client';
import type {
  AltosaActiveQuery,
  AltosaDocumentsQuery,
  AltosaProductsQuery,
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
