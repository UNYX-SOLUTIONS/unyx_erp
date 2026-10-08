-- AlterEnum
ALTER TYPE "KbValidationStatus" ADD VALUE 'SIN_PRECIO';

-- AlterTable
ALTER TABLE "kb_products" DROP COLUMN "color",
DROP COLUMN "price",
DROP COLUMN "variantCount",
DROP COLUMN "variantLabel";


-- CreateTable
CREATE TABLE "kb_product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "colorHex" TEXT,
    "price" DECIMAL(14,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sourceRowKey" TEXT,
    "especificaciones" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "kb_product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kb_product_variants_sku_key" ON "kb_product_variants"("sku");

-- CreateIndex
CREATE INDEX "kb_product_variants_productId_idx" ON "kb_product_variants"("productId");

-- CreateIndex
CREATE INDEX "kb_product_variants_isActive_deletedAt_idx" ON "kb_product_variants"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "kb_products_isActive_deletedAt_idx" ON "kb_products"("isActive", "deletedAt");

-- AddForeignKey
ALTER TABLE "kb_product_variants" ADD CONSTRAINT "kb_product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "kb_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

