'use client';

import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ProductDto } from '../types/product.types';
import {
  generalSchema,
  variantsSchema,
  type GeneralFormValues,
  type VariantsFormValues,
} from '../schemas/product-schema';

const EMPTY_GENERAL: GeneralFormValues = {
  name: '',
  sku: '',
  line: '',
  category: '',
  subcategory: '',
  isActive: true,
  commercialDescription: '',
  keywords: [],
};

const VARIANT_NAME_POOL = ['Taupe', 'Beige con café', 'Gris perla', 'Negro grafito', 'Azul marino'];
const VARIANT_COLOR_POOL = ['#B8A99A', '#D9CBB8', '#C9CDD1', '#3F3F46', '#334155'];

function buildGeneralDefaults(product: ProductDto): GeneralFormValues {
  return {
    ...EMPTY_GENERAL,
    name: product.name,
    sku: product.sku,
    line: product.line ?? '',
    category: product.category ?? '',
    subcategory: product.subcategory ?? '',
    isActive: product.isActive,
    commercialDescription: product.commercialDescription ?? '',
    keywords: product.keywords,
  };
}

function buildVariantsDefaults(product: ProductDto): VariantsFormValues {
  const count = Math.max(1, product.variantCount);
  return {
    variants: Array.from({ length: count }, (_, index) => {
      const name =
        index === 0 && product.color
          ? product.color
          : (VARIANT_NAME_POOL[index % VARIANT_NAME_POOL.length] as string);
      return {
        id: `${product.id}-v${index + 1}`,
        name,
        sku: `${product.sku}-${index + 1}`,
        color: VARIANT_COLOR_POOL[index % VARIANT_COLOR_POOL.length] as string,
        colorLabel: name,
        price: product.price ?? 0,
        description: '',
        isActive: true,
      };
    }),
  };
}

export function useProductDetail(product: ProductDto | null) {
  const generalForm = useForm<GeneralFormValues>({
    resolver: zodResolver(generalSchema),
    defaultValues: EMPTY_GENERAL,
  });

  const variantsForm = useForm<VariantsFormValues>({
    resolver: zodResolver(variantsSchema),
    defaultValues: { variants: [] },
  });

  const variantsArray = useFieldArray({
    control: variantsForm.control,
    name: 'variants',
  });

  useEffect(() => {
    if (!product) {
      return;
    }
    generalForm.reset(buildGeneralDefaults(product));
    variantsForm.reset(buildVariantsDefaults(product));
  }, [product, generalForm, variantsForm]);

  const resetAll = () => {
    if (!product) {
      return;
    }
    generalForm.reset(buildGeneralDefaults(product));
    variantsForm.reset(buildVariantsDefaults(product));
  };

  const isDirty = generalForm.formState.isDirty || variantsForm.formState.isDirty;

  return {
    generalForm,
    variantsForm,
    variantsArray,
    isDirty,
    resetAll,
  };
}
