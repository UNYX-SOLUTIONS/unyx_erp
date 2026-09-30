'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import { Tag } from 'lucide-react';
import { TagsInput } from '../TagsInput';
import { SectionCard } from '../SectionCard';
import type { GeneralFormValues } from '../../../schemas/product-schema';

export function KeywordsSection({ form }: { form: UseFormReturn<GeneralFormValues> }) {
  const { control } = form;

  return (
    <SectionCard
      icon={Tag}
      title="Palabras clave / Sinónimos comerciales"
      headerRight={<span className="text-xs text-gray-400">Facilita el match en chat</span>}
    >
      <Controller
        control={control}
        name="keywords"
        render={({ field }) => (
          <TagsInput value={field.value} onChange={field.onChange} />
        )}
      />
    </SectionCard>
  );
}
