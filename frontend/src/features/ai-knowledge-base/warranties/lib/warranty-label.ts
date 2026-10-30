import type { WarrantyDto } from '../types/warranty.types';

export function warrantyLabel(
  warranty: Pick<WarrantyDto, 'id' | 'meses' | 'especial'>
): string {
  const months =
    warranty.meses === null
      ? null
      : `${warranty.meses} ${warranty.meses === 1 ? 'mes' : 'meses'}`;
  const special = warranty.especial?.trim();
  return [months, special].filter(Boolean).join(' · ') || `Garantía #${warranty.id}`;
}
