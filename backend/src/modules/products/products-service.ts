import { StatusCodes } from 'http-status-codes';
import type { KbProduct, KbProductVariant, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/api-error';
import { writeAudit } from '../../utils/audit';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';
import type {
  CreateProductInput,
  CreateVariantInput,
  ProductDetailDto,
  ProductDto,
  ProductListFilters,
  ProductListResult,
  UpdateProductInput,
  UpdateVariantInput,
  VariantDto,
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

function toVariantDto(variant: KbProductVariant): VariantDto {
  return {
    id: variant.id,
    productId: variant.productId,
    sku: variant.sku,
    name: variant.name,
    color: variant.color,
    colorHex: variant.colorHex,
    price: variant.price === null ? null : Number(variant.price),
    stock: variant.stock,
    imageUrl: variant.imageUrl,
    description: variant.description,
    isActive: variant.isActive,
    sortOrder: variant.sortOrder,
    especificaciones: variant.especificaciones,
    createdAt: variant.createdAt.toISOString(),
    updatedAt: variant.updatedAt.toISOString(),
  };
}

function toProductDto(product: KbProduct, variants: KbProductVariant[]): ProductDto {
  const activeVariants = variants.filter((variant) => variant.deletedAt === null);
  const prices = activeVariants
    .map((variant) => variant.price)
    .filter((price): price is NonNullable<typeof price> => price !== null)
    .map((price) => Number(price));

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
    thumbnailUrl: product.thumbnailUrl,
    sourceUrl: product.sourceUrl,
    validation: product.validation,
    syncStatus: product.syncStatus,
    isActive: product.isActive,
    variantCount: activeVariants.length,
    price: prices.length > 0 ? Math.min(...prices) : null,
    priceFrom: activeVariants.length > 1,
    primaryColor: activeVariants[0]?.color ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function buildVariantData(input: {
  sku: string;
  name: string;
  color?: string;
  colorHex?: string;
  price?: number | null;
  stock?: number;
  imageUrl?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}) {
  return {
    sku: input.sku,
    name: input.name,
    color: input.color || null,
    colorHex: input.colorHex || null,
    price: input.price ?? null,
    stock: input.stock ?? 0,
    imageUrl: input.imageUrl || null,
    description: input.description || null,
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    sortOrder: input.sortOrder ?? 0,
  };
}

async function generateVariantSku(
  client: Prisma.TransactionClient,
  parentSku: string,
  startIndex: number
): Promise<string> {
  let index = startIndex;
  for (;;) {
    const candidate = `${parentSku}-V${index}`;
    const existing = await client.kbProductVariant.findUnique({ where: { sku: candidate } });
    if (!existing) {
      return candidate;
    }
    index += 1;
  }
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
            {
              variants: {
                some: {
                  deletedAt: null,
                  OR: [
                    { sku: { contains: filters.search, mode: 'insensitive' } },
                    { color: { contains: filters.search, mode: 'insensitive' } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  const [total, products] = await prisma.$transaction([
    prisma.kbProduct.count({ where }),
    prisma.kbProduct.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
      include: {
        variants: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
      },
    }),
  ]);

  return {
    items: products.map((product) => toProductDto(product, product.variants)),
    meta: buildPaginationMeta(total, { skip, take, page, limit }),
  };
}

export async function getProductById(id: string): Promise<ProductDetailDto> {
  const companyId = await resolveCompanyId();
  const product = await prisma.kbProduct.findFirst({
    where: { id, companyId, deletedAt: null },
    include: {
      variants: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Producto no encontrado', 'PRODUCT_NOT_FOUND');
  }
  return {
    ...toProductDto(product, product.variants),
    variants: product.variants.map(toVariantDto),
  };
}

export async function createProduct(input: CreateProductInput): Promise<ProductDetailDto> {
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

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.kbProduct.create({
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
        thumbnailUrl: input.thumbnailUrl || null,
        sourceUrl: input.sourceUrl || null,
        ...(input.validation ? { validation: input.validation } : {}),
        ...(input.syncStatus ? { syncStatus: input.syncStatus } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });

    if (input.variants?.length) {
      for (const [index, variant] of input.variants.entries()) {
        const sku = variant.sku ?? (await generateVariantSku(tx, created.sku, index + 1));
        await tx.kbProductVariant.create({
          data: {
            productId: created.id,
            ...buildVariantData({ ...variant, sku, sortOrder: variant.sortOrder ?? index }),
          },
        });
      }
    }

    return tx.kbProduct.findUniqueOrThrow({
      where: { id: created.id },
      include: { variants: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } } },
    });
  });

  await writeAudit({
    companyId,
    action: 'kb-product.create',
    entity: 'KbProduct',
    entityId: product.id,
    newValues: toProductDto(product, product.variants),
  });

  return { ...toProductDto(product, product.variants), variants: product.variants.map(toVariantDto) };
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<ProductDetailDto> {
  const companyId = await resolveCompanyId();

  const existing = await prisma.kbProduct.findFirst({
    where: { id, companyId, deletedAt: null },
    include: { variants: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } } },
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
      ...(input.thumbnailUrl !== undefined ? { thumbnailUrl: input.thumbnailUrl || null } : {}),
      ...(input.sourceUrl !== undefined ? { sourceUrl: input.sourceUrl || null } : {}),
      ...(input.validation !== undefined ? { validation: input.validation } : {}),
      ...(input.syncStatus !== undefined ? { syncStatus: input.syncStatus } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    include: { variants: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } } },
  });

  await writeAudit({
    companyId,
    action: 'kb-product.update',
    entity: 'KbProduct',
    entityId: product.id,
    oldValues: toProductDto(existing, existing.variants),
    newValues: toProductDto(product, product.variants),
  });

  return { ...toProductDto(product, product.variants), variants: product.variants.map(toVariantDto) };
}

export async function deleteProduct(id: string): Promise<ProductDto> {
  const companyId = await resolveCompanyId();

  const existing = await prisma.kbProduct.findFirst({
    where: { id, companyId, deletedAt: null },
    include: { variants: { where: { deletedAt: null } } },
  });
  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Producto no encontrado', 'PRODUCT_NOT_FOUND');
  }

  const now = new Date();
  const product = await prisma.$transaction(async (tx) => {
    await tx.kbProductVariant.updateMany({
      where: { productId: id, deletedAt: null },
      data: { deletedAt: now },
    });
    return tx.kbProduct.update({ where: { id }, data: { deletedAt: now } });
  });

  await writeAudit({
    companyId,
    action: 'kb-product.delete',
    entity: 'KbProduct',
    entityId: product.id,
    oldValues: toProductDto(existing, existing.variants),
  });

  return toProductDto(product, []);
}

export async function listVariants(productId: string): Promise<VariantDto[]> {
  const companyId = await resolveCompanyId();
  const product = await prisma.kbProduct.findFirst({
    where: { id: productId, companyId, deletedAt: null },
  });
  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Producto no encontrado', 'PRODUCT_NOT_FOUND');
  }
  const variants = await prisma.kbProductVariant.findMany({
    where: { productId, deletedAt: null },
    orderBy: { sortOrder: 'asc' },
  });
  return variants.map(toVariantDto);
}

export async function addVariant(productId: string, input: CreateVariantInput): Promise<VariantDto> {
  const companyId = await resolveCompanyId();
  const product = await prisma.kbProduct.findFirst({
    where: { id: productId, companyId, deletedAt: null },
    include: { _count: { select: { variants: true } } },
  });
  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Producto no encontrado', 'PRODUCT_NOT_FOUND');
  }

  if (input.sku) {
    const duplicate = await prisma.kbProductVariant.findUnique({ where: { sku: input.sku } });
    if (duplicate) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'Ya existe una variante con ese SKU',
        'VARIANT_SKU_EXISTS'
      );
    }
  }

  const variant = await prisma.$transaction(async (tx) => {
    const sku = input.sku ?? (await generateVariantSku(tx, product.sku, product._count.variants + 1));
    return tx.kbProductVariant.create({
      data: {
        productId,
        ...buildVariantData({
          ...input,
          sku,
          sortOrder: input.sortOrder ?? product._count.variants,
        }),
      },
    });
  });

  await writeAudit({
    companyId,
    action: 'kb-variant.create',
    entity: 'KbProductVariant',
    entityId: variant.id,
    newValues: toVariantDto(variant),
  });

  return toVariantDto(variant);
}

export async function updateVariant(
  productId: string,
  variantId: string,
  input: UpdateVariantInput
): Promise<VariantDto> {
  const companyId = await resolveCompanyId();
  const existing = await prisma.kbProductVariant.findFirst({
    where: { id: variantId, productId, deletedAt: null },
    include: { product: { select: { companyId: true } } },
  });
  if (!existing || existing.product.companyId !== companyId) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Variante no encontrada', 'VARIANT_NOT_FOUND');
  }

  if (input.sku && input.sku !== existing.sku) {
    const duplicate = await prisma.kbProductVariant.findUnique({ where: { sku: input.sku } });
    if (duplicate) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'Ya existe una variante con ese SKU',
        'VARIANT_SKU_EXISTS'
      );
    }
  }

  const variant = await prisma.kbProductVariant.update({
    where: { id: variantId },
    data: {
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.color !== undefined ? { color: input.color || null } : {}),
      ...(input.colorHex !== undefined ? { colorHex: input.colorHex || null } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.stock !== undefined ? { stock: input.stock } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl || null } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });

  await writeAudit({
    companyId,
    action: 'kb-variant.update',
    entity: 'KbProductVariant',
    entityId: variant.id,
    oldValues: toVariantDto(existing),
    newValues: toVariantDto(variant),
  });

  return toVariantDto(variant);
}

export async function deleteVariant(productId: string, variantId: string): Promise<VariantDto> {
  const companyId = await resolveCompanyId();
  const existing = await prisma.kbProductVariant.findFirst({
    where: { id: variantId, productId, deletedAt: null },
    include: { product: { select: { companyId: true } } },
  });
  if (!existing || existing.product.companyId !== companyId) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Variante no encontrada', 'VARIANT_NOT_FOUND');
  }

  const variant = await prisma.kbProductVariant.update({
    where: { id: variantId },
    data: { deletedAt: new Date() },
  });

  await writeAudit({
    companyId,
    action: 'kb-variant.delete',
    entity: 'KbProductVariant',
    entityId: variant.id,
    oldValues: toVariantDto(existing),
  });

  return toVariantDto(variant);
}
