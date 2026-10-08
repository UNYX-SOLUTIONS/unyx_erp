'use client';

import { type UseFormReturn } from 'react-hook-form';
import { MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '../FormField';
import { SectionCard } from '../SectionCard';
import type { GeneralFormValues } from '../../../schemas/product-schema';

export function CommercialDescriptionSection({ form }: { form: UseFormReturn<GeneralFormValues> }) {
  const { register, formState } = form;

  return (
    <SectionCard
      icon={MessageSquare}
      title="Descripción comercial para el asistente IA"
      headerRight={
        <span className="text-xs text-gray-400 dark:text-slate-500">Información utilizada por el asistente comercial</span>
      }
    >
      <FormField
        label="Descripción"
        htmlFor="detail-product-description"
        error={formState.errors.commercialDescription?.message}
      >
        <Textarea
          id="detail-product-description"
          rows={5}
          placeholder="Describe el producto de forma atractiva para el asistente comercial..."
          {...register('commercialDescription')}
        />
      </FormField>
    </SectionCard>
  );
}
