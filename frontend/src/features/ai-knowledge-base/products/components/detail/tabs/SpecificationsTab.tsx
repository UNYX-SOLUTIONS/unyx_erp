import { SlidersHorizontal } from 'lucide-react';
import { TabComingSoon } from './TabComingSoon';

export function SpecificationsTab() {
  return (
    <TabComingSoon
      icon={SlidersHorizontal}
      message="Aquí se editarán las especificaciones técnicas del producto (dimensiones, peso, materiales, colores disponibles, etc.)."
    />
  );
}
