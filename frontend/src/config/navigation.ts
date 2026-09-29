import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Calculator,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Package,
  Settings,
  ShoppingCart,
  Truck,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operaciones',
    items: [
      { title: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Pedidos', href: '/dashboard/orders', icon: ShoppingCart },
    ],
  },
  {
    title: 'Bodega',
    items: [
      { title: 'Inventario', href: '/dashboard/inventory', icon: Package },
      { title: 'Picking', href: '/dashboard/picking', icon: ClipboardList },
      { title: 'Movimientos', href: '/dashboard/movements', icon: ArrowLeftRight },
      { title: 'Transferencias', href: '/dashboard/transfers', icon: Truck },
      { title: 'Conteos', href: '/dashboard/counts', icon: Calculator },
      { title: 'Ubicaciones', href: '/dashboard/locations', icon: MapPin },
    ],
  },
  {
    title: 'Logística',
    items: [
      { title: 'Despachos y entregas', href: '/dashboard/dispatches', icon: Truck },
      { title: 'Agenda', href: '/dashboard/schedule', icon: Calendar },
      { title: 'Incidencias', href: '/dashboard/incidents', icon: AlertTriangle },
    ],
  },
];

export const FOOTER_NAV: NavItem[] = [
  { title: 'Configuración', href: '/dashboard/settings/profile', icon: Settings },
];
