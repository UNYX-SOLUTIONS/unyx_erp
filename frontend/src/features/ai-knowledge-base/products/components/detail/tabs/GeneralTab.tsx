'use client';

import type { UseFormReturn } from 'react-hook-form';
import { CommercialDescriptionSection } from '../sections/CommercialDescriptionSection';
import { IdentificationSection } from '../sections/IdentificationSection';
import { KeywordsSection } from '../sections/KeywordsSection';
import type { GeneralFormValues } from '../../../schemas/product-schema';

export function GeneralTab({
  form,
  onToggleActive,
}: {
  form: UseFormReturn<GeneralFormValues>;
  onToggleActive?: (isActive: boolean) => void | Promise<void>;
}) {
  return (
    <div className="space-y-6">
      <IdentificationSection form={form} onToggleActive={onToggleActive} />
      <CommercialDescriptionSection form={form} />
      <KeywordsSection form={form} />
    </div>
  );
}
