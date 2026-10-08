import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { seedCompanyRoles } from '../src/modules/auth/role-templates';

const prisma = new PrismaClient();

const PERMISSION_MODULES = [
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

const CRUD_ACTIONS = ['create', 'read', 'update', 'delete'] as const;
const READ_ONLY_MODULES = ['reports', 'audit'] as const;

const DEMO_COMPANY_TAX_ID = '0000000000001';
const DEMO_ADMIN_EMAIL = 'admin@unyx.erp';
const DEMO_ADMIN_USERNAME = 'admin';

async function main() {
  for (const module of PERMISSION_MODULES) {
    const actions = (READ_ONLY_MODULES as readonly string[]).includes(module)
      ? (['read'] as const)
      : CRUD_ACTIONS;
    for (const action of actions) {
      const code = `${module}.${action}`;
      await prisma.permission.upsert({
        where: { code },
        update: { module, action },
        create: { code, module, action, description: `${module} ${action}` },
      });
    }
  }

  const permissionCount = await prisma.permission.count();

  if (process.env.NODE_ENV === 'production') {
    console.log(`Seed completado: ${permissionCount} permisos (datos demo omitidos en producción)`);
    return;
  }

  const demoAdminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';

  const demoCompany = await prisma.company.upsert({
    where: { taxId: DEMO_COMPANY_TAX_ID },
    update: {},
    create: {
      name: 'Unyx Demo',
      legalName: 'Unyx Solutions Demo',
      taxId: DEMO_COMPANY_TAX_ID,
      email: 'demo@unyx.erp',
      currency: 'USD',
      timezone: 'America/Guayaquil',
      locale: 'es-EC',
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: DEMO_ADMIN_EMAIL },
    update: { username: DEMO_ADMIN_USERNAME },
    create: {
      companyId: demoCompany.id,
      email: DEMO_ADMIN_EMAIL,
      username: DEMO_ADMIN_USERNAME,
      passwordHash: await bcrypt.hash(demoAdminPassword, 12),
      firstName: 'Admin',
      lastName: 'Unyx',
      isSuperAdmin: true,
      emailVerified: true,
    },
  });

  const roles = await seedCompanyRoles(prisma, demoCompany.id);
  const adminRole = roles.find((role) => role.name === 'Admin');
  if (adminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole.id },
    });
  }

  console.log(
    `Seed completado: ${permissionCount} permisos, ${roles.length} roles, admin ${DEMO_ADMIN_EMAIL}`
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
