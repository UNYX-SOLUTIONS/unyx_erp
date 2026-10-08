'use client';

import type { UseFormReturn } from 'react-hook-form';
import { CommercialDescriptionSection } from '../sections/CommercialDescriptionSection';
import { IdentificationSection } from '../sections/IdentificationSection';
import { KeywordsSection } from '../sections/KeywordsSection';
import type { GeneralFormValues } from '../../../schemas/product-schema';

export function GeneralTab({ form }: { form: UseFormReturn<GeneralFormValues> }) {
  return (
    <div className="space-y-6">
      <IdentificationSection form={form} />
      <CommercialDescriptionSection form={form} />
      <KeywordsSection form={form} />
    </div>
  );
}
