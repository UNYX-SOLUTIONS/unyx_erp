'use client';

import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { Product } from '../types/product.types';
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

const DETAIL_OVERRIDES: Record<string, Partial<GeneralFormValues>> = {
  'p-1': {
    category: 'Sillas Tapizadas',
    subcategory: 'Interiores / Oficina ejecutiva y residencial',
    commercialDescription:
      'Silla ergonómica Sandy tapizada con soporte lumbar anatómico integrado y espuma inyectada de alta densidad. Diseñada para largas jornadas de trabajo corporativo o home office, combinando confort y diseño contemporáneo con acabado neutro de alta durabilidad.',
    keywords: ['silla oficina', 'ejecutiva', 'ergonómica', 'tapizada beige'],
  },
};

function buildGeneralDefaults(product: Product): GeneralFormValues {
  return {
    ...EMPTY_GENERAL,
    name: product.name,
    sku: product.sku,
    line: product.line,
    category: product.line,
    ...DETAIL_OVERRIDES[product.id],
  };
}

function buildVariantsDefaults(product: Product): VariantsFormValues {
  const count = Math.max(1, product.variants.count);
  return {
    variants: Array.from({ length: count }, (_, index) => {
      const name = VARIANT_NAME_POOL[index % VARIANT_NAME_POOL.length] as string;
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

export function useProductDetail(product: Product | null) {
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

  const submitGeneral = generalForm.handleSubmit((values) => {
    console.log('Guardar detalle (General)', values);
    toast.success('Cambios guardados');
    generalForm.reset(values);
  });

  const submitVariants = variantsForm.handleSubmit((values) => {
    console.log('Guardar detalle (Variantes y precios)', values);
    toast.success('Cambios guardados');
    variantsForm.reset(values);
  });

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
    submitGeneral: () => void submitGeneral(),
    submitVariants: () => void submitVariants(),
    resetAll,
  };
}
