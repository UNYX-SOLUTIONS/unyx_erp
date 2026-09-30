-- CreateEnum
CREATE TYPE "KbValidationStatus" AS ENUM ('APROBADO', 'PENDIENTE', 'REQUIERE_CORRECCION');

-- CreateEnum
CREATE TYPE "KbSyncStatus" AS ENUM ('SINCRONIZADO', 'SIN_SINCRONIZAR');

-- CreateTable
CREATE TABLE "kb_products" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "line" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "description" TEXT,
    "commercialDescription" TEXT,
    "keywords" TEXT[],
    "color" TEXT,
    "price" DECIMAL(12,2),
    "validation" "KbValidationStatus" NOT NULL DEFAULT 'PENDIENTE',
    "syncStatus" "KbSyncStatus" NOT NULL DEFAULT 'SIN_SINCRONIZAR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "thumbnailUrl" TEXT,
    "sourceUrl" TEXT,
    "variantCount" INTEGER NOT NULL DEFAULT 1,
    "variantLabel" TEXT,
    "sourceRowKey" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "categoryId" TEXT,

    CONSTRAINT "kb_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kb_products_companyId_idx" ON "kb_products"("companyId");

-- CreateIndex
CREATE INDEX "kb_products_validation_idx" ON "kb_products"("validation");

-- CreateIndex
CREATE INDEX "kb_products_syncStatus_idx" ON "kb_products"("syncStatus");

-- CreateIndex
CREATE INDEX "kb_products_line_idx" ON "kb_products"("line");

-- CreateIndex
CREATE UNIQUE INDEX "kb_products_companyId_sku_key" ON "kb_products"("companyId", "sku");

-- AddForeignKey
ALTER TABLE "kb_products" ADD CONSTRAINT "kb_products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kb_products" ADD CONSTRAINT "kb_products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
