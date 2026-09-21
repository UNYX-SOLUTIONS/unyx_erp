export const PERMISSION_MODULES = [
  'companies',
  'branches',
  'warehouses',
  'users',
  'roles',
  'permissions',
  'categories',
  'units',
  'taxes',
  'brands',
  'products',
  'inventory',
  'customers',
  'suppliers',
  'purchases',
  'sales',
  'accounting',
  'hr',
  'reports',
  'audit',
  'settings',
] as const;

export const PERMISSION_ACTIONS = ['create', 'read', 'update', 'delete'] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
export type PermissionCode = `${PermissionModule}.${PermissionAction}`;

export const PERMISSION_LABELS: Record<PermissionModule, string> = {
  companies: 'Empresas',
  branches: 'Sucursales',
  warehouses: 'Bodegas',
  users: 'Usuarios',
  roles: 'Roles',
  permissions: 'Permisos',
  categories: 'Categorías',
  units: 'Unidades',
  taxes: 'Impuestos',
  brands: 'Marcas',
  products: 'Productos',
  inventory: 'Inventario',
  customers: 'Clientes',
  suppliers: 'Proveedores',
  purchases: 'Compras',
  sales: 'Ventas',
  accounting: 'Contabilidad',
  hr: 'RRHH',
  reports: 'Reportes',
  audit: 'Auditoría',
  settings: 'Configuración',
};

export const ACTION_LABELS: Record<PermissionAction, string> = {
  create: 'Crear',
  read: 'Ver',
  update: 'Actualizar',
  delete: 'Eliminar',
};

export function permissionLabel(code: string): string {
  const [module, action] = code.split('.') as [PermissionModule, PermissionAction];
  return `${PERMISSION_LABELS[module]} - ${ACTION_LABELS[action]}`;
}
