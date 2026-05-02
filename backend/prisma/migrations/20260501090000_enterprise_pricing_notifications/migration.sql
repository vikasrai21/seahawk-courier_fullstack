ALTER TABLE "clients"
  ADD COLUMN IF NOT EXISTS "normalized_name" TEXT,
  ADD COLUMN IF NOT EXISTS "notification_config" JSONB;

UPDATE "clients"
SET "normalized_name" = regexp_replace(lower(COALESCE("company", '')), '[^a-z0-9]', '', 'g')
WHERE "normalized_name" IS NULL;

CREATE INDEX IF NOT EXISTS "clients_normalized_name_idx" ON "clients"("normalized_name");

ALTER TABLE "contracts"
  ADD COLUMN IF NOT EXISTS "base_charge" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "pricing_rules" JSONB;
