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
  categoryId: 0,
  subcategoryId: 0,
  line: '',
  category: '',
  subcategory: '',
  isActive: true,
  commercialDescription: '',
  keywords: [],
};

function createGeneralDefaults(): GeneralFormValues {
  return { ...EMPTY_GENERAL, keywords: [] };
}

function buildGeneralDefaults(product: ProductDetailDto): GeneralFormValues {
  return {
    ...EMPTY_GENERAL,
    name: product.name,
    sku: product.sku,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId,
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
      colorLabel: variant.color ?? '',
      price: variant.price ?? 0,
      description: variant.description ?? '',
      imageUrl: variant.imageUrl ?? '',
      isActive: variant.isActive,
      estadoId: variant.estadoId,
      kommoTemplateId: variant.kommoTemplateId ?? null,
      garantiaId: variant.garantiaId ?? null,
    })),
  };
}

export function useProductDetail(
  product: ProductDetailDto | null,
  isCreate = false,
  isOpen = true
) {
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

  // Los refetch en segundo plano (p. ej. al quitar un mapeo) no deben borrar
  // ediciones locales. Si el formulario está limpio, sí se sincroniza con la
  // última versión del producto.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (isCreate) {
      generalForm.reset(createGeneralDefaults());
      variantsForm.reset({ variants: [] });
      return;
    }
    if (!product) {
      return;
    }
    if (generalForm.formState.isDirty || variantsForm.formState.isDirty) {
      return;
    }
    generalForm.reset(buildGeneralDefaults(product));
    variantsForm.reset(buildVariantsDefaults(product));
  }, [isCreate, isOpen, product, generalForm, variantsForm]);

  const resetAll = () => {
    if (isCreate || !product) {
      generalForm.reset(createGeneralDefaults());
      variantsForm.reset({ variants: [] });
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
