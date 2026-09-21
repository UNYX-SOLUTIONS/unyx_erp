import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  FileText,
  Truck,
  Users,
  Factory,
  BookOpen,
  Briefcase,
  BarChart3,
  Settings,
  User,
  Building2,
  Shield,
  CreditCard,
  Boxes,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  children?: NavItem[];
}

export const NAVIGATION: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    title: 'Inventario',
    href: '/dashboard/inventory',
    icon: Boxes,
    permission: 'products.read',
    children: [
      {
        title: 'Productos',
        href: '/dashboard/inventory',
        icon: Package,
        permission: 'products.read',
      },
      {
        title: 'Categorías',
        href: '/dashboard/inventory/categories',
        icon: Tags,
        permission: 'categories.read',
      },
    ],
  },
  {
    title: 'Ventas',
    href: '/dashboard/sales',
    icon: ShoppingCart,
    permission: 'sales.read',
    children: [
      {
        title: 'Todas las ventas',
        href: '/dashboard/sales',
        icon: ShoppingCart,
        permission: 'sales.read',
      },
      {
        title: 'Nueva venta',
        href: '/dashboard/sales/new',
        icon: FileText,
        permission: 'sales.create',
      },
      {
        title: 'Facturas',
        href: '/dashboard/sales/invoices',
        icon: FileText,
        permission: 'sales.read',
      },
    ],
  },
  { title: 'Compras', href: '/dashboard/purchases', icon: Truck, permission: 'purchases.read' },
  { title: 'Clientes', href: '/dashboard/customers', icon: Users, permission: 'customers.read' },
  {
    title: 'Proveedores',
    href: '/dashboard/suppliers',
    icon: Factory,
    permission: 'suppliers.read',
  },
  {
    title: 'Contabilidad',
    href: '/dashboard/accounting',
    icon: BookOpen,
    permission: 'accounting.read',
  },
  { title: 'RRHH', href: '/dashboard/hr', icon: Briefcase, permission: 'hr.read' },
  { title: 'Reportes', href: '/dashboard/reports', icon: BarChart3, permission: 'reports.read' },
  {
    title: 'Configuración',
    href: '/dashboard/settings/profile',
    icon: Settings,
    children: [
      { title: 'Mi perfil', href: '/dashboard/settings/profile', icon: User },
      {
        title: 'Empresa',
        href: '/dashboard/settings/company',
        icon: Building2,
        permission: 'companies.update',
      },
      {
        title: 'Usuarios',
        href: '/dashboard/settings/users',
        icon: Users,
        permission: 'users.read',
      },
      { title: 'Roles', href: '/dashboard/settings/roles', icon: Shield, permission: 'roles.read' },
      {
        title: 'Facturación',
        href: '/dashboard/settings/billing',
        icon: CreditCard,
        permission: 'companies.update',
      },
    ],
  },
];
