import { ApiError } from '../../utils/api-error';
import { contificoGet, contificoPatch, contificoPost } from './contifico-client';
import { resolveContificoSku, toNumber } from './contifico-mappers';
import type {
  ContificoCategoryDto,
  ContificoCreateProductInput,
  ContificoProductDto,
  ContificoUpdateProductInput,
} from './contifico-types';

const PAGE_SIZE = 100;
const MAX_PAGES = 2_000;

function mergePages(pages: ContificoProductDto[][]): ContificoProductDto[] {
  const byId = new Map<string, ContificoProductDto>();
  for (const page of pages) {
    for (const product of page) {
      byId.set(product.id, product);
    }
  }
  return Array.from(byId.values());
}

async function fetchProductPages(estado?: 'A' | 'I'): Promise<ContificoProductDto[]> {
  const pages: ContificoProductDto[][] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const items = await contificoGet<ContificoProductDto[]>('/producto/', {
      page,
      ...(estado ? { estado } : {}),
    });

    if (!Array.isArray(items) || items.length === 0) {
      break;
    }

    const fresh = items.filter((item) => !seen.has(item.id));
    if (fresh.length === 0) {
      // La API no soporta paginación (devuelve lo mismo) o ya terminó.
      break;
    }

    for (const item of fresh) {
      seen.add(item.id);
    }
    pages.push(fresh);

    if (items.length < PAGE_SIZE) {
      break;
    }
  }

  return mergePages(pages);
}

/**
 * Obtiene el catálogo completo de Contifico. Se consultan ambos estados
 * (A/I) para que una desactivación en Contifico también se propague.
 * El dedupe por `id` tolera APIs que ignoran el parámetro `page`.
 */
export async function fetchAllContificoProducts(): Promise<ContificoProductDto[]> {
  const [active, inactive] = await Promise.all([
    fetchProductPages('A'),
    fetchProductPages('I'),
  ]);
  return mergePages([active, inactive]);
}

export async function fetchContificoProductById(id: string): Promise<ContificoProductDto> {
  return contificoGet<ContificoProductDto>(`/producto/${encodeURIComponent(id)}/`);
}

export async function fetchContificoCategories(): Promise<ContificoCategoryDto[]> {
  const categories = await contificoGet<ContificoCategoryDto[]>('/categoria/');
  return Array.isArray(categories) ? categories : [];
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

export async function resolveContificoCategoryId(
  name: string,
  categories?: ContificoCategoryDto[]
): Promise<string | null> {
  const target = normalizeName(name);
  if (!target) {
    return null;
  }

  const all = categories ?? (await fetchContificoCategories());
  const exact = all.find((category) => normalizeName(category.nombre) === target);
  if (exact) {
    return exact.id;
  }

  const partial = all.find((category) => normalizeName(category.nombre).includes(target));
  if (partial) {
    return partial.id;
  }

  try {
    const created = await contificoPost<ContificoCategoryDto>('/categoria/', { nombre: name.trim() });
    return created.id;
  } catch {
    // Si la API rechaza la creación (p. ej. por permisos), el producto
    // se crea sin categoría en Contifico en lugar de fallar por completo.
    return null;
  }
}

function buildProductBody(input: ContificoCreateProductInput, categoryId: string | null) {
  const pvp1 = input.pvp1 ?? 0;
  const body: Record<string, unknown> = {
    codigo: input.codigo,
    nombre: input.nombre,
    minimo: String(input.minimo ?? 0),
    pvp1: String(pvp1),
    pvp_manual: input.pvpManual ?? pvp1 <= 0,
    estado: input.estado ?? 'A',
    tipo: input.tipo ?? 'PRO',
    tipo_producto: input.tipoProducto ?? 'SIM',
    para_pos: true,
  };

  if (input.descripcion) body.descripcion = input.descripcion;
  if (categoryId) body.categoria_id = categoryId;
  if (input.codigoBarra) body.codigo_barra = input.codigoBarra;
  if (input.porcentajeIva !== undefined && input.porcentajeIva !== null) {
    body.porcentaje_iva = input.porcentajeIva;
  }

  return body;
}

export async function createContificoProduct(
  input: ContificoCreateProductInput
): Promise<ContificoProductDto> {
  if (input.codigo.trim().length === 0) {
    throw new ApiError(422, 'El SKU/código es obligatorio para crear el producto en Contifico.', 'CONTIFICO_SKU_REQUIRED');
  }
  if (input.codigo.length > 25) {
    throw new ApiError(
      422,
      'El código de Contifico admite máximo 25 caracteres. Ajusta el SKU del producto.',
      'CONTIFICO_SKU_TOO_LONG'
    );
  }

  const categoryId = input.categoriaNombre
    ? await resolveContificoCategoryId(input.categoriaNombre)
    : null;

  const created = await contificoPost<ContificoProductDto>(
    '/producto/',
    buildProductBody(input, categoryId)
  );

  if (created && typeof created.id === 'string') {
    return created;
  }

  const products = await fetchAllContificoProducts();
  const found = products.find((product) => resolveContificoSku(product) === input.codigo);
  if (!found) {
    throw new ApiError(
      502,
      'Contifico no devolvió el producto creado.',
      'CONTIFICO_CREATE_NO_RESPONSE'
    );
  }
  return found;
}

export async function updateContificoProduct(
  id: string,
  input: ContificoUpdateProductInput
): Promise<ContificoProductDto> {
  const body: Record<string, unknown> = {};
  if (input.nombre !== undefined) body.nombre = input.nombre;
  if (input.descripcion !== undefined) body.descripcion = input.descripcion;
  if (input.estado !== undefined) body.estado = input.estado;
  if (input.codigoBarra !== undefined) body.codigo_barra = input.codigoBarra;
  if (input.porcentajeIva !== undefined) body.porcentaje_iva = input.porcentajeIva;
  if (input.minimo !== undefined) body.minimo = String(input.minimo ?? 0);
  if (input.pvp1 !== undefined) body.pvp1 = String(input.pvp1 ?? 0);
  if (input.pvpManual !== undefined) body.pvp_manual = input.pvpManual;
  if (input.imagen !== undefined) body.imagen = input.imagen ?? '';
  if (input.categoriaNombre) {
    const categoryId = await resolveContificoCategoryId(input.categoriaNombre);
    if (categoryId) body.categoria_id = categoryId;
  }

  const updated = await contificoPatch<ContificoProductDto>(
    `/producto/${encodeURIComponent(id)}/`,
    body
  );
  if (updated && typeof updated.id === 'string') {
    return updated;
  }
  return fetchContificoProductById(id);
}

export async function deactivateContificoProduct(id: string): Promise<ContificoProductDto> {
  return updateContificoProduct(id, { estado: 'I' });
}

export function mapContificoPrice(product: ContificoProductDto): number | null {
  return toNumber(product.pvp1);
}
