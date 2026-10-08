'use client';

import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ProductDetailDto } from '../types/product.types';
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

function buildGeneralDefaults(product: ProductDetailDto): GeneralFormValues {
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

function buildVariantsDefaults(product: ProductDetailDto): VariantsFormValues {
  return {
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      color: variant.colorHex ?? '#9CA3AF',
      colorLabel: variant.color ?? variant.name,
      price: variant.price ?? 0,
      description: variant.description ?? '',
      isActive: variant.isActive,
    })),
  };
}

export function useProductDetail(product: ProductDetailDto | null) {
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
