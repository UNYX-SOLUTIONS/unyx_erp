import { StatusCodes } from 'http-status-codes';
import type { KbProduct, KbProductVariant, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ApiError } from '../../utils/api-error';
import { writeAudit } from '../../utils/audit';
import { buildPaginationMeta, getPagination } from '../../utils/pagination';
import {
  contificoIdFromSourceRowKey,
  createContificoProductFromErp,
  deactivateContificoProductFromErp,
  isContificoConfigured,
  updateContificoProductFromErp,
} from '../../integrations/contifico/contifico-service';
import { syncLocalProductToAltosa } from '../../integrations/contifico/contifico-sync';
import { resolveContificoSku, toNumber } from '../../integrations/contifico/contifico-mappers';
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
    stock: activeVariants.reduce((sum, variant) => sum + variant.stock, 0),
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
  imageUrl?: string | null;
  description?: string | null;
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

  const firstVariant = input.variants?.[0];
  const contificoProduct = await createContificoProductFromErp({
    sku: input.sku,
    name: input.name,
    description: input.description,
    commercialDescription: input.commercialDescription,
    category: input.category,
    line: input.line,
    isActive: input.isActive,
    price: firstVariant?.price ?? null,
  });

  const contificoSourceKey = contificoProduct ? `contifico:${contificoProduct.id}` : null;
  const contificoCreated = Boolean(contificoProduct);
  const contificoPrice = contificoProduct ? toNumber(contificoProduct.pvp1) : null;
  const contificoStock = contificoProduct
    ? Math.round(toNumber(contificoProduct.cantidad_stock) ?? 0)
    : 0;
  const contificoImage = contificoProduct?.imagen?.trim() || null;

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
        thumbnailUrl: input.thumbnailUrl || contificoImage,
        sourceUrl: input.sourceUrl || null,
        ...(input.validation ? { validation: input.validation } : {}),
        syncStatus: contificoCreated ? 'SINCRONIZADO' : input.syncStatus ?? 'SIN_SINCRONIZAR',
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        sourceRowKey: contificoSourceKey,
        lastSyncedAt: contificoProduct ? new Date() : null,
      },
    });

    if (input.variants?.length) {
      for (const [index, variant] of input.variants.entries()) {
        const sku = variant.sku ?? (await generateVariantSku(tx, created.sku, index + 1));
        const isPrimary = index === 0 && contificoSourceKey !== null;
        await tx.kbProductVariant.create({
          data: {
            productId: created.id,
            ...buildVariantData({
              ...variant,
              sku,
              price: isPrimary && contificoPrice !== null ? contificoPrice : variant.price,
              stock: isPrimary ? contificoStock : variant.stock,
              imageUrl: isPrimary && contificoImage ? contificoImage : variant.imageUrl,
              sortOrder: variant.sortOrder ?? index,
            }),
            ...(isPrimary
              ? {
                  sourceRowKey: contificoSourceKey,
                  especificaciones: {
                    contifico_id: contificoProduct?.id,
                    stock: contificoStock,
                  },
                }
              : {}),
          },
        });
      }
    } else {
      // Todo producto debe tener al menos su variante principal para que el
      // panel de detalle y Altosa muestren SKU/precio/stock.
      await tx.kbProductVariant.create({
        data: {
          productId: created.id,
          sku: contificoProduct ? resolveContificoSku(contificoProduct) : created.sku,
          name: 'Estándar',
          price: contificoPrice,
          stock: contificoStock,
          imageUrl: contificoImage ?? input.thumbnailUrl ?? null,
          description: contificoProduct?.descripcion || input.description || null,
          sortOrder: 0,
          sourceRowKey: contificoSourceKey,
          especificaciones: contificoProduct
            ? {
                contifico_id: contificoProduct.id,
                contifico_codigo: resolveContificoSku(contificoProduct),
                codigo_barra: contificoProduct.codigo_barra || null,
                porcentaje_iva: toNumber(contificoProduct.porcentaje_iva),
                minimo: toNumber(contificoProduct.minimo),
                stock: contificoStock,
              }
            : {},
        },
      });
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

  await syncLocalProductToAltosa(product.id);
  return getProductById(product.id);
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

  const contificoId = contificoIdFromSourceRowKey(existing.sourceRowKey);
  if (contificoId && !isContificoConfigured()) {
    throw new ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      'Este producto está vinculado a Contifico. Configura CONTIFICO_API_KEY para editarlo y mantener la sincronización.',
      'CONTIFICO_NOT_CONFIGURED'
    );
  }
  if (contificoId && input.sku && input.sku !== existing.sku) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'El SKU de un producto sincronizado con Contifico no se puede cambiar desde el ERP. Cámbialo en Contifico y vuelve a sincronizar.',
      'CONTIFICO_PRODUCT_SKU_LOCKED'
    );
  }
  if (contificoId && isContificoConfigured()) {
    await updateContificoProductFromErp(contificoId, {
      name: input.name,
      description: input.description,
      commercialDescription: input.commercialDescription,
      category: input.category,
      line: input.line,
      isActive: input.isActive,
    });
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
      ...(contificoId && isContificoConfigured()
        ? { syncStatus: 'SINCRONIZADO' as const, lastSyncedAt: new Date() }
        : input.syncStatus !== undefined
          ? { syncStatus: input.syncStatus }
          : {}),
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

  await syncLocalProductToAltosa(product.id);
  return getProductById(id);
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

  const contificoId = contificoIdFromSourceRowKey(existing.sourceRowKey);
  if (contificoId && !isContificoConfigured()) {
    throw new ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      'Este producto está vinculado a Contifico. Configura CONTIFICO_API_KEY para eliminarlo y mantener la sincronización.',
      'CONTIFICO_NOT_CONFIGURED'
    );
  }
  if (contificoId && isContificoConfigured()) {
    await deactivateContificoProductFromErp(contificoId);
  }

  await prisma.kbProduct.update({
    where: { id },
    data: {
      isActive: false,
      ...(contificoId && isContificoConfigured()
        ? { syncStatus: 'SINCRONIZADO' as const, lastSyncedAt: new Date() }
        : {}),
    },
  });
  await syncLocalProductToAltosa(id);

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

  await syncLocalProductToAltosa(productId);
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
    include: { product: { select: { companyId: true, sourceRowKey: true } } },
  });
  if (!existing || existing.product.companyId !== companyId) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Variante no encontrada', 'VARIANT_NOT_FOUND');
  }

  const isPrimaryContificoVariant = existing.sourceRowKey?.startsWith('contifico:') ?? false;
  const contificoId = contificoIdFromSourceRowKey(existing.product.sourceRowKey);

  if (isPrimaryContificoVariant && contificoId && !isContificoConfigured()) {
    throw new ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      'La variante principal está vinculada a Contifico. Configura CONTIFICO_API_KEY para editarla y mantener la sincronización.',
      'CONTIFICO_NOT_CONFIGURED'
    );
  }

  if (input.sku && input.sku !== existing.sku) {
    if (isPrimaryContificoVariant) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'No se puede cambiar el SKU de la variante principal desde el ERP. Cámbialo en Contifico y vuelve a sincronizar.',
        'CONTIFICO_PRIMARY_VARIANT_SKU_LOCKED'
      );
    }
    const duplicate = await prisma.kbProductVariant.findUnique({ where: { sku: input.sku } });
    if (duplicate) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'Ya existe una variante con ese SKU',
        'VARIANT_SKU_EXISTS'
      );
    }
  }

  if (
    isPrimaryContificoVariant &&
    contificoId &&
    isContificoConfigured() &&
    (input.price !== undefined ||
      input.description !== undefined ||
      input.imageUrl !== undefined ||
      input.isActive !== undefined)
  ) {
    await updateContificoProductFromErp(contificoId, {
      price: input.price,
      description: input.description,
      imageUrl: input.imageUrl,
      isActive: input.isActive,
    });
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

  await syncLocalProductToAltosa(productId);
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

  if (existing.sourceRowKey?.startsWith('contifico:')) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'No se puede eliminar la variante principal de un producto sincronizado con Contifico. Desactiva el producto en su lugar.',
      'CONTIFICO_PRIMARY_VARIANT_LOCKED'
    );
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

  await syncLocalProductToAltosa(productId);
  return toVariantDto(variant);
}
