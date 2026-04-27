-- Add lightweight business profile fields for printable invoices.
ALTER TABLE "users" ADD COLUMN "businessName" TEXT;
ALTER TABLE "users" ADD COLUMN "businessEmail" TEXT;
ALTER TABLE "users" ADD COLUMN "businessPhone" TEXT;
ALTER TABLE "users" ADD COLUMN "businessAddress" TEXT;

-- Scope customer and product records by owner for commercial multi-user use.
ALTER TABLE "customers" ADD COLUMN "userId" TEXT;
ALTER TABLE "products" ADD COLUMN "userId" TEXT;

ALTER TABLE "customers" ADD CONSTRAINT "customers_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "products" ADD CONSTRAINT "products_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "customers_name_email_key";
DROP INDEX IF EXISTS "products_sku_key";

CREATE UNIQUE INDEX "customers_userId_name_email_key" ON "customers"("userId", "name", "email");
CREATE INDEX "customers_userId_idx" ON "customers"("userId");

CREATE UNIQUE INDEX "products_userId_sku_key" ON "products"("userId", "sku");
CREATE INDEX "products_userId_idx" ON "products"("userId");
