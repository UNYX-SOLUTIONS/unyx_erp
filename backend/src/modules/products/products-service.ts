import { StatusCodes } from 'http-status-codes';
import type { KbProduct, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/api-error';
import { writeAudit } from '../../utils/audit';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';
import type {
  CreateProductInput,
  ProductDto,
  ProductListFilters,
  ProductListResult,
  UpdateProductInput,
} from './products-types';

const DEFAULT_COMPANY_TAX_ID = '0000000000001';

export async function resolveCompanyId(): Promise<string> {
  const company =
    (await prisma.company.findUnique({ where: { taxId: DEFAULT_COMPANY_TAX_ID } })) ??
    (await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } }));
  if (!company) {
    throw new ApiError(
      StatusCodes.PRECONDITION_FAILED,
      'No hay una empresa configurada',
      'COMPANY_NOT_CONFIGURED'
    );
  }
  return company.id;
}

function toDto(product: KbProduct): ProductDto {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    line: product.line,
    category: product.category,
    subcategory: product.subcategory,
    description: product.description,
    commercialDescription: product.commercialDescription,
    keywords: product.keywords,
    color: product.color,
    price: product.price === null ? null : Number(product.price),
    validation: product.validation,
    syncStatus: product.syncStatus,
    isActive: product.isActive,
    thumbnailUrl: product.thumbnailUrl,
    sourceUrl: product.sourceUrl,
    variantCount: product.variantCount,
    variantLabel: product.variantLabel,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export async function listProducts(filters: ProductListFilters): Promise<ProductListResult> {
  const companyId = await resolveCompanyId();
  const { skip, take, page, limit } = getPagination({
    page: filters.page,
    limit: filters.limit,
  });

  const where: Prisma.KbProductWhereInput = {
    companyId,
    deletedAt: null,
    ...(filters.validation ? { validation: filters.validation } : {}),
    ...(filters.syncStatus ? { syncStatus: filters.syncStatus } : {}),
    ...(filters.line ? { line: filters.line } : {}),
    ...(filters.search
      ? {
          OR: [
            { sku: { contains: filters.search, mode: 'insensitive' } },
            { name: { contains: filters.search, mode: 'insensitive' } },
            { line: { contains: filters.search, mode: 'insensitive' } },
            { category: { contains: filters.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, products] = await prisma.$transaction([
    prisma.kbProduct.count({ where }),
    prisma.kbProduct.findMany({ where, orderBy: { updatedAt: 'desc' }, skip, take }),
  ]);

  return {
    items: products.map(toDto),
    meta: buildPaginationMeta(total, { skip, take, page, limit }),
  };
}

export async function getProductById(id: string): Promise<ProductDto> {
  const companyId = await resolveCompanyId();
  const product = await prisma.kbProduct.findFirst({
    where: { id, companyId, deletedAt: null },
  });
  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Producto no encontrado', 'PRODUCT_NOT_FOUND');
  }
  return toDto(product);
}

export async function createProduct(input: CreateProductInput): Promise<ProductDto> {
  const companyId = await resolveCompanyId();

  const existing = await prisma.kbProduct.findUnique({
    where: { companyId_sku: { companyId, sku: input.sku } },
  });
  if (existing) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Ya existe un producto con ese SKU',
      'PRODUCT_SKU_EXISTS'
    );
  }

  const product = await prisma.kbProduct.create({
    data: {
      companyId,
      sku: input.sku,
      name: input.name,
      line: input.line || null,
      category: input.category || null,
      subcategory: input.subcategory || null,
      description: input.description || null,
      commercialDescription: input.commercialDescription || null,
      keywords: input.keywords ?? [],
      color: input.color || null,
      price: input.price ?? null,
      ...(input.validation ? { validation: input.validation } : {}),
      ...(input.syncStatus ? { syncStatus: input.syncStatus } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      thumbnailUrl: input.thumbnailUrl || null,
      sourceUrl: input.sourceUrl || null,
      ...(input.variantCount !== undefined ? { variantCount: input.variantCount } : {}),
      variantLabel: input.variantLabel || null,
    },
  });

  await writeAudit({
    companyId,
    action: 'kb-product.create',
    entity: 'KbProduct',
    entityId: product.id,
    newValues: toDto(product),
  });

  return toDto(product);
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<ProductDto> {
  const companyId = await resolveCompanyId();

  const existing = await prisma.kbProduct.findFirst({
    where: { id, companyId, deletedAt: null },
  });
  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Producto no encontrado', 'PRODUCT_NOT_FOUND');
  }

  if (input.sku && input.sku !== existing.sku) {
    const duplicate = await prisma.kbProduct.findUnique({
      where: { companyId_sku: { companyId, sku: input.sku } },
    });
    if (duplicate) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'Ya existe un producto con ese SKU',
        'PRODUCT_SKU_EXISTS'
      );
    }
  }

  const product = await prisma.kbProduct.update({
    where: { id },
    data: {
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.line !== undefined ? { line: input.line || null } : {}),
      ...(input.category !== undefined ? { category: input.category || null } : {}),
      ...(input.subcategory !== undefined ? { subcategory: input.subcategory || null } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.commercialDescription !== undefined
        ? { commercialDescription: input.commercialDescription || null }
        : {}),
      ...(input.keywords !== undefined ? { keywords: input.keywords } : {}),
      ...(input.color !== undefined ? { color: input.color || null } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.validation !== undefined ? { validation: input.validation } : {}),
      ...(input.syncStatus !== undefined ? { syncStatus: input.syncStatus } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.thumbnailUrl !== undefined ? { thumbnailUrl: input.thumbnailUrl || null } : {}),
      ...(input.sourceUrl !== undefined ? { sourceUrl: input.sourceUrl || null } : {}),
      ...(input.variantCount !== undefined ? { variantCount: input.variantCount } : {}),
      ...(input.variantLabel !== undefined ? { variantLabel: input.variantLabel || null } : {}),
    },
  });

  await writeAudit({
    companyId,
    action: 'kb-product.update',
    entity: 'KbProduct',
    entityId: product.id,
    oldValues: toDto(existing),
    newValues: toDto(product),
  });

  return toDto(product);
}

export async function deleteProduct(id: string): Promise<ProductDto> {
  const companyId = await resolveCompanyId();

  const existing = await prisma.kbProduct.findFirst({
    where: { id, companyId, deletedAt: null },
  });
  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Producto no encontrado', 'PRODUCT_NOT_FOUND');
  }

  const product = await prisma.kbProduct.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await writeAudit({
    companyId,
    action: 'kb-product.delete',
    entity: 'KbProduct',
    entityId: product.id,
    oldValues: toDto(existing),
  });

  return toDto(product);
}
