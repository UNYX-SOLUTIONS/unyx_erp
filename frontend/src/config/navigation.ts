import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ArrowLeftRight,
  BookOpen,
  Calculator,
  Calendar,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Library,
  MapPin,
  Package,
  Settings,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
}

export interface NavSubcategory {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
  permission?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
  subcategories?: NavSubcategory[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operaciones',
    items: [
      { title: 'Inicio', href: '/operations/dashboard', icon: LayoutDashboard },
      { title: 'Pedidos', href: '/operations/orders', icon: ShoppingCart },
    ],
    subcategories: [
      {
        title: 'Bodega',
        icon: Package,
        items: [
          { title: 'Inventario', href: '/operations/warehouse/inventory', icon: Package },
          { title: 'Picking', href: '/operations/warehouse/picking', icon: ClipboardList },
          { title: 'Movimientos', href: '/operations/warehouse/movements', icon: ArrowLeftRight },
          { title: 'Transferencias', href: '/operations/warehouse/transfers', icon: Truck },
          { title: 'Conteos', href: '/operations/warehouse/counts', icon: Calculator },
          { title: 'Ubicaciones', href: '/operations/warehouse/locations', icon: MapPin },
        ],
      },
      {
        title: 'Logística',
        icon: Truck,
        items: [
          { title: 'Despachos y entregas', href: '/operations/logistics/dispatches', icon: Truck },
          { title: 'Agenda', href: '/operations/logistics/schedule', icon: Calendar },
          { title: 'Incidencias', href: '/operations/logistics/incidents', icon: AlertTriangle },
        ],
      },
    ],
  },
  {
    title: 'Inteligencia Artificial',
    items: [],
    subcategories: [
      {
        title: 'Base de conocimiento',
        icon: BookOpen,
        items: [
          { title: 'Resumen', href: '/ai/knowledge-base/summary', icon: FileText },
          { title: 'Productos', href: '/ai/knowledge-base/products', icon: Package },
          { title: 'Ubicaciones', href: '/ai/knowledge-base/locations', icon: MapPin },
          { title: 'Catálogos', href: '/ai/knowledge-base/catalogs', icon: Library },
          {
            title: 'Garantías',
            href: '/dashboard/ai/knowledge-base/warranties',
            icon: ShieldCheck,
          },
          { title: 'Configuración IA', href: '/dashboard/ai/settings', icon: Settings2 },
        ],
      },
    ],
  },
];

export const FOOTER_NAV: NavItem[] = [
  { title: 'Configuración', href: '/dashboard/settings/profile', icon: Settings },
];
