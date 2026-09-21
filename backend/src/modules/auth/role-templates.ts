import type { Prisma } from '@prisma/client';

interface RoleTemplate {
  description: string;
  excludedModules?: string[];
  modules?: string[];
  readOnly?: boolean;
}

export const ROLE_TEMPLATES: Record<string, RoleTemplate> = {
  Admin: { description: 'Acceso total al sistema' },
  Manager: {
    description: 'Gestión general sin roles ni permisos',
    excludedModules: ['roles', 'permissions'],
  },
  Seller: {
    description: 'Ventas e inventario',
    modules: ['sales', 'customers', 'products', 'categories', 'inventory', 'reports'],
  },
  Viewer: { description: 'Solo lectura', readOnly: true },
};

export async function seedCompanyRoles(tx: Prisma.TransactionClient, companyId: string) {
  const permissions = await tx.permission.findMany({
    select: { id: true, code: true, module: true },
  });

  for (const [name, template] of Object.entries(ROLE_TEMPLATES)) {
    const role = await tx.role.upsert({
      where: { companyId_name: { companyId, name } },
      update: { description: template.description },
      create: { companyId, name, description: template.description, isSystem: true },
    });

    const allowedPermissions = permissions.filter((permission) => {
      if (template.readOnly) {
        return permission.code.endsWith('.read');
      }
      if (template.modules) {
        return template.modules.includes(permission.module);
      }
      if (template.excludedModules) {
        return !template.excludedModules.includes(permission.module);
      }
      return true;
    });

    await tx.rolePermission.createMany({
      data: allowedPermissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });
  }

  return tx.role.findMany({
    where: { companyId, name: { in: Object.keys(ROLE_TEMPLATES) } },
  });
}
