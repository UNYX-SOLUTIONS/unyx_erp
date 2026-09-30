import { formatLastUpdate } from '@/lib/formatters';
import type { Product, ProductDto, ProductStatus } from './types/product.types';

const VALIDATION_TO_STATUS: Record<ProductDto['validation'], ProductStatus> = {
  APROBADO: 'approved',
  PENDIENTE: 'pending',
  REQUIERE_CORRECCION: 'needsCorrection',
};

export function mapProductDtoToUi(dto: ProductDto): Product {
  return {
    id: dto.id,
    name: dto.name,
    sku: dto.sku,
    line: dto.line ?? dto.category ?? '',
    variants: {
      count: dto.variantCount,
      ...(dto.variantLabel ? { label: dto.variantLabel } : {}),
    },
    price: dto.price,
    priceFrom: false,
    status: VALIDATION_TO_STATUS[dto.validation],
    syncStatus: dto.syncStatus === 'SINCRONIZADO' ? 'synced' : 'notSynced',
    lastUpdate: { label: formatLastUpdate(dto.updatedAt) },
  };
}
