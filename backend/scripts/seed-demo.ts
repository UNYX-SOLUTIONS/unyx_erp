import 'dotenv/config';
import { PrismaClient, type KbValidationStatus } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_COMPANY_TAX_ID = '0000000000001';

interface DemoVariant {
  sku: string;
  name: string;
  color: string;
  colorHex: string;
  price: number | null;
}

interface DemoProduct {
  sku: string;
  name: string;
  line: string;
  category: string;
  subcategory: string;
  commercialDescription: string;
  keywords: string[];
  validation: KbValidationStatus;
  variants: DemoVariant[];
}

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    sku: 'ALT-P-1042',
    name: 'Silla Sandy',
    line: 'Sillas Tapizadas',
    category: 'Sillas Tapizadas',
    subcategory: 'Interiores / Oficina',
    commercialDescription:
      'Silla ergonómica Sandy tapizada con soporte lumbar anatómico integrado y espuma inyectada de alta densidad.',
    keywords: ['silla oficina', 'ejecutiva', 'ergonómica', 'tapizada'],
    validation: 'PENDIENTE',
    variants: [
      { sku: 'ALT-P-1042-1', name: 'Taupe', color: 'Taupe', colorHex: '#B8A99A', price: 95 },
      { sku: 'ALT-P-1042-2', name: 'Beige con café', color: 'Beige con café', colorHex: '#D9CBB8', price: 95 },
    ],
  },
  {
    sku: 'ALT-P-2018',
    name: 'Silla Oliva',
    line: 'Sillas Tapizadas',
    category: 'Sillas Tapizadas',
    subcategory: 'Interiores / Comedor',
    commercialDescription: 'Silla tapizada en tono verde oliva con estructura metálica reforzada.',
    keywords: ['silla comedor', 'tapizada'],
    validation: 'APROBADO',
    variants: [
      { sku: 'ALT-P-2018-1', name: 'Verde Oliva', color: 'Verde Oliva', colorHex: '#7A8B5C', price: 110 },
      { sku: 'ALT-P-2018-2', name: 'Gris', color: 'Gris', colorHex: '#9CA3AF', price: 110 },
      { sku: 'ALT-P-2018-3', name: 'Mostaza', color: 'Mostaza', colorHex: '#D4A937', price: 115 },
    ],
  },
  {
    sku: 'ALT-P-3845',
    name: 'Silla Antonia',
    line: 'Sillas de Oficina',
    category: 'Sillas de Oficina',
    subcategory: 'Oficina ejecutiva',
    commercialDescription: 'Silla ejecutiva con mecanismo reclinable y base giratoria.',
    keywords: ['silla ejecutiva', 'oficina'],
    validation: 'APROBADO',
    variants: [
      { sku: 'ALT-P-3845-1', name: 'Negro', color: 'Negro', colorHex: '#1F2937', price: 145 },
      { sku: 'ALT-P-3845-2', name: 'Azul marino', color: 'Azul marino', colorHex: '#334155', price: 145 },
    ],
  },
  {
    sku: 'ALT-P-4182',
    name: 'Sillón Bilbao ARM',
    line: 'Sillas de Oficina',
    category: 'Sillas de Oficina',
    subcategory: 'Sala de espera',
    commercialDescription: 'Sillón de brazos en estructura de madera y tapizado premium.',
    keywords: ['sillón', 'brazos'],
    validation: 'REQUIERE_CORRECCION',
    variants: [
      { sku: 'ALT-P-4182-1', name: 'Beige', color: 'Beige', colorHex: '#D9CBB8', price: null },
    ],
  },
  {
    sku: 'ALT-P-5820',
    name: 'Mesa Terra',
    line: 'Bases y mesas',
    category: 'Bases y mesas',
    subcategory: 'Sala / Recibidor',
    commercialDescription: 'Mesa auxiliar con tapa de madera natural y base metálica.',
    keywords: ['mesa', 'auxiliar'],
    validation: 'APROBADO',
    variants: [
      { sku: 'ALT-P-5820-1', name: 'Roble', color: 'Roble', colorHex: '#B08968', price: 180 },
      { sku: 'ALT-P-5820-2', name: 'Nogal', color: 'Nogal', colorHex: '#6B4F3A', price: 190 },
    ],
  },
  {
    sku: 'ALT-P-6231',
    name: 'Silla Plástica Mónaco',
    line: 'Sillas de Plastico',
    category: 'Sillas de Plastico',
    subcategory: 'Exteriores',
    commercialDescription: 'Silla monobloque de polipropileno resistente a la intemperie.',
    keywords: ['silla plástica', 'exterior'],
    validation: 'APROBADO',
    variants: [
      { sku: 'ALT-P-6231-1', name: 'Blanco', color: 'Blanco', colorHex: '#F3F4F6', price: 25.5 },
      { sku: 'ALT-P-6231-2', name: 'Negro', color: 'Negro', colorHex: '#1F2937', price: 25.5 },
      { sku: 'ALT-P-6231-3', name: 'Rojo', color: 'Rojo', colorHex: '#B91C1C', price: 27 },
    ],
  },
  {
    sku: 'ALT-P-7044',
    name: 'Taburete Alto Bari',
    line: 'Taburetes',
    category: 'Taburetes',
    subcategory: 'Barra / Cocina',
    commercialDescription: 'Taburete alto con asiento acolchado y reposapiés cromado.',
    keywords: ['taburete', 'barra'],
    validation: 'PENDIENTE',
    variants: [
      { sku: 'ALT-P-7044-1', name: 'Negro', color: 'Negro', colorHex: '#1F2937', price: 78 },
      { sku: 'ALT-P-7044-2', name: 'Café', color: 'Café', colorHex: '#6B4F3A', price: 78 },
    ],
  },
  {
    sku: 'ALT-P-8890',
    name: 'Silla Ergonómica Praga',
    line: 'Sillas de Oficina',
    category: 'Sillas de Oficina',
    subcategory: 'Home office',
    commercialDescription: 'Silla operativa con soporte lumbar ajustable y ruedas de silicona.',
    keywords: ['silla ergonómica', 'home office'],
    validation: 'APROBADO',
    variants: [
      { sku: 'ALT-P-8890-1', name: 'Gris', color: 'Gris', colorHex: '#9CA3AF', price: 210.75 },
      { sku: 'ALT-P-8890-2', name: 'Negro', color: 'Negro', colorHex: '#1F2937', price: 210.75 },
    ],
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
    const parent = await prisma.kbProduct.upsert({
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
        validation: product.validation,
        syncStatus: 'SINCRONIZADO',
        isActive: true,
        lastSyncedAt: new Date(),
      },
      update: {
        name: product.name,
        line: product.line,
        category: product.category,
        subcategory: product.subcategory,
        commercialDescription: product.commercialDescription,
        keywords: product.keywords,
        validation: product.validation,
      },
    });

    for (const [index, variant] of product.variants.entries()) {
      await prisma.kbProductVariant.upsert({
        where: { sku: variant.sku },
        create: {
          productId: parent.id,
          sku: variant.sku,
          name: variant.name,
          color: variant.color,
          colorHex: variant.colorHex,
          price: variant.price,
          sortOrder: index,
        },
        update: {
          productId: parent.id,
          name: variant.name,
          color: variant.color,
          colorHex: variant.colorHex,
          price: variant.price,
          sortOrder: index,
        },
      });
    }
  }

  const variantCount = DEMO_PRODUCTS.reduce((sum, product) => sum + product.variants.length, 0);
  console.log(
    `Seed demo completado: ${DEMO_PRODUCTS.length} productos y ${variantCount} variantes en kb_products`
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
