import { StatusCodes } from 'http-status-codes';
import type { KbSyncStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { ApiError } from '../../utils/api-error';
import { writeAudit } from '../../utils/audit';
import * as productsService from '../../modules/products/products-service';
import { resolveCompanyId } from '../../modules/products/products-service';
import { syncLocalProductToAltosa } from '../contifico/contifico-sync';
import type { CreateVariantInput } from '../../modules/products/products-types';
import * as altosaService from './altosa-service';
import type {
  AltosaCreateProductBody,
  AltosaUpdateProductBody,
  AltosaUpdateVariantBody,
} from './altosa-schema';

interface AltosaVariantRaw {
  id: number;
  sku: string | null;
  metaRetailerId?: string | null;
  metaMappingLocked?: boolean | null;
}

interface AltosaProductRaw {
  id: number;
  isActive?: boolean;
  variantes?: AltosaVariantRaw[];
}

export interface AltosaMetaMappingAuditContext {
  userId?: string;
  companyId?: string;
  ipAddress?: string;
  userAgent?: string;
}

type MetaMappingAction = 'assign' | 'clear' | 'unlock';

function normalizeMetaRetailerId(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function resolveMetaMappingAction(input: AltosaUpdateVariantBody): MetaMappingAction | null {
  if (input.metaRetailerId !== undefined) {
    if (normalizeMetaRetailerId(input.metaRetailerId) === null) {
      return input.metaMappingLocked === false ? 'unlock' : 'clear';
    }
    return 'assign';
  }
  return input.metaMappingLocked === false ? 'unlock' : null;
}

async function recordMetaMappingAudit(params: {
  context?: AltosaMetaMappingAuditContext;
  variantId: number;
  sku: string | null;
  action: MetaMappingAction;
  oldValue: { metaRetailerId: string | null; metaMappingLocked: boolean | null };
  newValue: { metaRetailerId: string | null; metaMappingLocked: boolean | null };
}): Promise<void> {
  const { context, variantId, sku, action, oldValue, newValue } = params;
  const timestamp = new Date().toISOString();

  logger.info(
    {
      audit: 'altosa.meta-mapping',
      userId: context?.userId ?? null,
      variantId,
      sku,
      oldValue,
      newValue,
      action,
      timestamp,
    },
    'Mapeo de catálogo Meta actualizado'
  );

  if (!context?.companyId) {
    return;
  }

  try {
    await writeAudit({
      companyId: context.companyId,
      userId: context.userId,
      action: `altosa.meta-mapping.${action}`,
      entity: 'AltosaProductVariant',
      entityId: String(variantId),
      oldValues: oldValue,
      newValues: newValue,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  } catch (error) {
    logger.error(
      { err: error, variantId },
      'No se pudo registrar la auditoría del mapeo Meta'
    );
  }
}

function asProduct(data: unknown): AltosaProductRaw {
  return data as AltosaProductRaw;
}

async function getAltosaProduct(id: number): Promise<AltosaProductRaw> {
  const { data } = await altosaService.getProductById(id);
  return asProduct(data);
}

function primarySku(product: AltosaProductRaw): string | null {
  return product.variantes?.find((variant) => Boolean(variant.sku))?.sku ?? null;
}

async function findLocalProductBySku(sku: string) {
  const companyId = await resolveCompanyId();

  const byProductSku = await prisma.kbProduct.findUnique({
    where: { companyId_sku: { companyId, sku } },
    include: { variants: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } } },
  });
  if (byProductSku) {
    return byProductSku;
  }

  const variant = await prisma.kbProductVariant.findFirst({
    where: {
      sku,
      deletedAt: null,
      product: { companyId, deletedAt: null },
    },
    include: {
      product: {
        include: {
          variants: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  });

  return variant?.product ?? null;
}

function mapVariantCreate(
  variants: AltosaCreateProductBody['variantes']
): CreateVariantInput[] | undefined {
  if (!variants?.length) {
    return undefined;
  }
  return variants.map((variant, index) => ({
    ...(variant.sku ? { sku: variant.sku } : {}),
    name: variant.color || variant.sku || `Variante ${index + 1}`,
    color: variant.color,
    price: variant.precioUsd ?? null,
    stock: 0,
    imageUrl: variant.imagenUrl || undefined,
    description: variant.descripcion,
    isActive: true,
    sortOrder: index,
  }));
}

export async function createProduct(input: AltosaCreateProductBody): Promise<unknown> {
  const sku =
    input.sku?.trim() ||
    input.variantes?.find((variant) => variant.sku)?.sku ||
    `ERP-${Date.now()}`;
  const variants = mapVariantCreate(input.variantes);

  await productsService.createProduct(
    {
      sku,
      name: input.nombre,
      line: input.line || input.category || input.subcategory || undefined,
      category: input.category || input.line || input.subcategory || undefined,
      subcategory: input.subcategory,
      description: input.usoRecomendado,
      commercialDescription: input.descripcion,
      isActive: true,
      ...(variants ? { variants } : {}),
    },
    // El alta desde el ERP valida/duplica y publica la primera variante en
    // Meta dentro de Altosa. El sync masivo de Contifico no usa este flag.
    { syncExternals: true }
  );

  const lookupSku = variants?.[0]?.sku || sku;
  const lookup = await altosaService.getProductByVariantSku(lookupSku);
  const lookupData = lookup.data as
    | { producto?: { id?: number }; id?: number }
    | undefined;
  const productId = lookupData?.producto?.id ?? lookupData?.id;

  if (!productId) {
    throw new Error(`Altosa no devolvió el producto creado para el SKU ${lookupSku}.`);
  }

  if (input.kommoTemplateId) {
    await altosaService.updateProduct(productId, {
      kommoTemplateId: input.kommoTemplateId,
    });
  }

  const { data } = await altosaService.getProductById(productId);
  return data;
}

export async function updateProduct(
  altosaId: number,
  input: AltosaUpdateProductBody
): Promise<unknown> {
  const current = await getAltosaProduct(altosaId);
  const sku = primarySku(current);
  const local = sku ? await findLocalProductBySku(sku) : null;

  if (!local) {
    const { data } = await altosaService.updateProduct(altosaId, input);
    return data;
  }

  await productsService.updateProduct(local.id, {
    ...(input.sku !== undefined ? { sku: input.sku } : {}),
    ...(input.nombre !== undefined ? { name: input.nombre } : {}),
    ...(input.line !== undefined ? { line: input.line } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.subcategory !== undefined ? { subcategory: input.subcategory } : {}),
    ...(input.usoRecomendado !== undefined
      ? { description: input.usoRecomendado ?? undefined }
      : {}),
    ...(input.descripcion !== undefined
      ? { commercialDescription: input.descripcion ?? undefined }
      : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  });

  // Un update explícito desde el ERP sí puede cambiar la taxonomía de Altosa.
  await syncLocalProductToAltosa(local.id, { updateTaxonomy: true });

  if (
    input.subcategoryId !== undefined ||
    input.estadoId !== undefined ||
    input.kommoTemplateId !== undefined
  ) {
    await altosaService.updateProduct(altosaId, {
      ...(input.subcategoryId !== undefined ? { subcategoryId: input.subcategoryId } : {}),
      ...(input.estadoId !== undefined ? { estadoId: input.estadoId } : {}),
      ...(input.kommoTemplateId !== undefined
        ? { kommoTemplateId: input.kommoTemplateId }
        : {}),
    });
  }

  const { data } = await altosaService.getProductById(altosaId);
  return data;
}

export async function deleteProduct(altosaId: number): Promise<unknown> {
  const current = await getAltosaProduct(altosaId);
  const sku = primarySku(current);
  const local = sku ? await findLocalProductBySku(sku) : null;

  if (!local) {
    const { data } = await altosaService.deleteProduct(altosaId);
    return data;
  }

  await productsService.deleteProduct(local.id);

  try {
    const { data } = await altosaService.getProductById(altosaId);
    return data;
  } catch {
    return {
      ...current,
      isActive: false,
      variantes: current.variantes?.map((variant) => ({ ...variant, isActive: false })),
    };
  }
}

export async function deleteVariant(variantId: number, productId?: number): Promise<unknown> {
  if (productId) {
    const current = await getAltosaProduct(productId);
    const index = current.variantes?.findIndex((variant) => variant.id === variantId) ?? -1;
    if (index === 0) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'No se puede eliminar la variante principal de un producto sincronizado con Contifico. Desactiva el producto en su lugar.',
        'CONTIFICO_PRIMARY_VARIANT_LOCKED'
      );
    }
  }

  const { data } = await altosaService.deleteVariant(variantId);
  return data;
}

async function markProductUnsynced(productId: string | undefined): Promise<void> {
  if (!productId) {
    return;
  }
  try {
    await prisma.kbProduct.update({
      where: { id: productId },
      data: { syncStatus: 'SIN_SINCRONIZAR' as KbSyncStatus },
    });
  } catch (error) {
    logger.warn(
      { err: error, productId },
      'No se pudo marcar el producto como SIN_SINCRONIZAR'
    );
  }
}

export async function updateVariant(
  variantId: number,
  input: AltosaUpdateVariantBody,
  productId?: number,
  auditContext?: AltosaMetaMappingAuditContext
): Promise<unknown> {
  const current = productId ? await getAltosaProduct(productId) : null;
  const rawVariant =
    current?.variantes?.find((variant) => variant.id === variantId) ?? null;
  const sku = rawVariant?.sku ?? (current ? primarySku(current) : null);
  const local = sku ? await findLocalProductBySku(sku) : null;
  const localVariant = local?.variants.find(
    (variant) => variant.sku === (rawVariant?.sku ?? sku)
  );

  const localUpdate = {
    ...(input.sku !== undefined ? { sku: input.sku } : {}),
    ...(input.color !== undefined ? { name: input.color, color: input.color } : {}),
    ...(input.descripcion !== undefined ? { description: input.descripcion } : {}),
    ...(input.precioUsd !== undefined ? { price: input.precioUsd } : {}),
    ...(input.imagenUrl !== undefined ? { imageUrl: input.imagenUrl } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  };

  if (local && localVariant && Object.keys(localUpdate).length > 0) {
    await productsService.updateVariant(local.id, localVariant.id, localUpdate);
  }

  let data: unknown;
  try {
    ({ data } = await altosaService.updateVariant(variantId, input));
  } catch (error) {
    // El update local ya se aplicó; marcamos el producto para que el sync
    // idempotente de Contifico/Altosa lo reintente y no quede deriva silenciosa.
    await markProductUnsynced(local?.id);
    throw error;
  }

  const action = resolveMetaMappingAction(input);
  if (action) {
    const updated = data as AltosaVariantRaw | null;
    await recordMetaMappingAudit({
      context: auditContext,
      variantId,
      sku: updated?.sku ?? sku,
      action,
      oldValue: {
        metaRetailerId: rawVariant?.metaRetailerId ?? null,
        metaMappingLocked: rawVariant?.metaMappingLocked ?? null,
      },
      newValue: {
        metaRetailerId: updated?.metaRetailerId ?? null,
        metaMappingLocked: updated?.metaMappingLocked ?? null,
      },
    });
  }

  return data;
}
