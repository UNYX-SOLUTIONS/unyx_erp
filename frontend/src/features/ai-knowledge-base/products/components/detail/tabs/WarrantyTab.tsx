import { ShieldCheck } from 'lucide-react';
import { TabComingSoon } from './TabComingSoon';

export function WarrantyTab() {
  return (
    <TabComingSoon
      icon={ShieldCheck}
      message="Aquí se editarán la fuente de datos y la garantía del producto (proveedor, tipo de garantía, duración, condiciones)."
    />
  );
}
