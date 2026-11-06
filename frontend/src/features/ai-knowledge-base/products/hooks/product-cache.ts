import type { QueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@/types/api-types';
import type { ProductDetailDto, VariantDto } from '../types/product.types';

function withVariants(
  current: ApiResponse<ProductDetailDto>,
  variants: VariantDto[]
): ApiResponse<ProductDetailDto> {
  return {
    ...current,
    data: {
      ...current.data,
      variants,
      variantCount: variants.length,
    },
  };
}

export function mergeVariantIntoProductCache(
  queryClient: QueryClient,
  productId: string,
  variant: VariantDto
): void {
  queryClient.setQueryData<ApiResponse<ProductDetailDto>>(
    ['product', productId],
    (current) => {
      if (!current) {
        return current;
      }
      const exists = current.data.variants.some((item) => item.id === variant.id);
      const variants = exists
        ? current.data.variants.map((item) =>
            item.id === variant.id
              ? {
                  ...item,
                  ...variant,
                  sortOrder: item.sortOrder,
                  createdAt: item.createdAt,
                }
              : item
          )
        : [...current.data.variants, variant];
      return withVariants(current, variants);
    }
  );
}

export function markProductsListStale(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ['products'], refetchType: 'none' });
}
