import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_COMPANY_TAX_ID = '0000000000001';

const DEMO_PRODUCTS = [
  {
    sku: 'ALT-P-1042',
    name: 'Silla Sandy',
    line: 'Sillas Tapizadas',
    category: 'Sillas Tapizadas',
    subcategory: 'Interiores / Oficina',
    commercialDescription:
      'Silla ergonómica Sandy tapizada con soporte lumbar anatómico integrado y espuma inyectada de alta densidad.',
    keywords: ['silla oficina', 'ejecutiva', 'ergonómica'],
    color: 'Taupe',
    price: 95,
    validation: 'PENDIENTE' as const,
  },
  {
    sku: 'ALT-P-2018',
    name: 'Silla Oliva',
    line: 'Sillas Tapizadas',
    category: 'Sillas Tapizadas',
    subcategory: 'Interiores / Comedor',
    commercialDescription: 'Silla tapizada en tono verde oliva con estructura metálica reforzada.',
    keywords: ['silla comedor', 'tapizada'],
    color: 'Verde Oliva',
    price: 110,
    validation: 'APROBADO' as const,
  },
  {
    sku: 'ALT-P-3845',
    name: 'Silla Antonia',
    line: 'Sillas de Oficina',
    category: 'Sillas de Oficina',
    subcategory: 'Oficina ejecutiva',
    commercialDescription: 'Silla ejecutiva con mecanismo reclinable y base giratoria.',
    keywords: ['silla ejecutiva', 'oficina'],
    color: 'Negro',
    price: 145,
    validation: 'APROBADO' as const,
  },
  {
    sku: 'ALT-P-4182',
    name: 'Sillón Bilbao ARM',
    line: 'Sillas de Oficina',
    category: 'Sillas de Oficina',
    subcategory: 'Sala de espera',
    commercialDescription: 'Sillón de brazos en estructura de madera y tapizado premium.',
    keywords: ['sillón', 'brazos'],
    color: 'Beige',
    price: null,
    validation: 'REQUIERE_CORRECCION' as const,
  },
  {
    sku: 'ALT-P-5820',
    name: 'Mesa Terra',
    line: 'Bases y mesas',
    category: 'Bases y mesas',
    subcategory: 'Sala / Recibidor',
    commercialDescription: 'Mesa auxiliar con tapa de madera natural y base metálica.',
    keywords: ['mesa', 'auxiliar'],
    color: 'Roble',
    price: 180,
    validation: 'APROBADO' as const,
  },
  {
    sku: 'ALT-P-6231',
    name: 'Silla Plástica Mónaco',
    line: 'Sillas de Plastico',
    category: 'Sillas de Plastico',
    subcategory: 'Exteriores',
    commercialDescription: 'Silla monobloque de polipropileno resistente a la intemperie.',
    keywords: ['silla plástica', 'exterior'],
    color: 'Blanco',
    price: 25.5,
    validation: 'APROBADO' as const,
  },
  {
    sku: 'ALT-P-7044',
    name: 'Taburete Alto Bari',
    line: 'Taburetes',
    category: 'Taburetes',
    subcategory: 'Barra / Cocina',
    commercialDescription: 'Taburete alto con asiento acolchado y reposapiés cromado.',
    keywords: ['taburete', 'barra'],
    color: 'Negro',
    price: 78,
    validation: 'PENDIENTE' as const,
  },
  {
    sku: 'ALT-P-8890',
    name: 'Silla Ergonómica Praga',
    line: 'Sillas de Oficina',
    category: 'Sillas de Oficina',
    subcategory: 'Home office',
    commercialDescription: 'Silla operativa con soporte lumbar ajustable y ruedas de silicona.',
    keywords: ['silla ergonómica', 'home office'],
    color: 'Gris',
    price: 210.75,
    validation: 'APROBADO' as const,
  },
];

async function resolveCompanyId(): Promise<string> {
  const company =
    (await prisma.company.findUnique({ where: { taxId: DEFAULT_COMPANY_TAX_ID } })) ??
    (await prisma.company.findFirst({ orderBy: { createdAt: 'asc' } }));
  if (!company) {
    throw new Error('No hay empresa configurada. Corre primero: pnpm db:seed');
  }
  return company.id;
}

async function main(): Promise<void> {
  const companyId = await resolveCompanyId();

  for (const product of DEMO_PRODUCTS) {
    await prisma.kbProduct.upsert({
      where: { companyId_sku: { companyId, sku: product.sku } },
      create: {
        companyId,
        sku: product.sku,
        name: product.name,
        line: product.line,
        category: product.category,
        subcategory: product.subcategory,
        commercialDescription: product.commercialDescription,
        keywords: product.keywords,
        color: product.color,
        price: product.price,
        validation: product.validation,
        syncStatus: 'SINCRONIZADO',
        isActive: true,
        variantCount: 1,
        variantLabel: product.color,
        lastSyncedAt: new Date(),
      },
      update: {
        name: product.name,
        line: product.line,
        category: product.category,
        subcategory: product.subcategory,
        commercialDescription: product.commercialDescription,
        keywords: product.keywords,
        color: product.color,
        price: product.price,
        validation: product.validation,
      },
    });
  }

  console.log(`Seed demo completado: ${DEMO_PRODUCTS.length} productos en kb_products`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
