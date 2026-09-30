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
  href: string;
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
      { title: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Pedidos', href: '/dashboard/orders', icon: ShoppingCart },
    ],
    subcategories: [
      {
        title: 'Bodega',
        href: '/dashboard/inventory',
        icon: Package,
        items: [
          { title: 'Picking', href: '/dashboard/picking', icon: ClipboardList },
          { title: 'Movimientos', href: '/dashboard/movements', icon: ArrowLeftRight },
          { title: 'Transferencias', href: '/dashboard/transfers', icon: Truck },
          { title: 'Conteos', href: '/dashboard/counts', icon: Calculator },
          { title: 'Ubicaciones', href: '/dashboard/locations', icon: MapPin },
        ],
      },
      {
        title: 'Logística',
        href: '/dashboard/dispatches',
        icon: Truck,
        items: [
          { title: 'Agenda', href: '/dashboard/schedule', icon: Calendar },
          { title: 'Incidencias', href: '/dashboard/incidents', icon: AlertTriangle },
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
        href: '/dashboard/ai/knowledge-base',
        icon: BookOpen,
        items: [
          { title: 'Resumen', href: '/dashboard/ai/knowledge-base/summary', icon: FileText },
          { title: 'Productos', href: '/dashboard/ai/knowledge-base/products', icon: Package },
          { title: 'Ubicaciones', href: '/dashboard/ai/knowledge-base/locations', icon: MapPin },
          { title: 'Catálogos', href: '/dashboard/ai/knowledge-base/catalogs', icon: Library },
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
