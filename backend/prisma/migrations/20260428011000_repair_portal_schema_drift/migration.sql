-- Repair migration for environments where code/schema moved ahead of the
-- actual database. All operations are idempotent so this can be applied
-- safely to both older and already-updated databases.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'UserRole'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'UserRole'
      AND e.enumlabel = 'OWNER'
  ) THEN
    ALTER TYPE "UserRole" ADD VALUE 'OWNER';
  END IF;
END $$;

ALTER TABLE "clients"
  ADD COLUMN IF NOT EXISTS "auto_topup_rule" JSONB,
  ADD COLUMN IF NOT EXISTS "brand_settings" JSONB;

ALTER TABLE "shipments"
  ADD COLUMN IF NOT EXISTS "cost" DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "profit" DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "risk_score" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "risk_factors" JSONB,
  ADD COLUMN IF NOT EXISTS "margin_alert" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "shipments"
  ALTER COLUMN "cost" SET DEFAULT 0,
  ALTER COLUMN "profit" SET DEFAULT 0,
  ALTER COLUMN "margin_alert" SET DEFAULT false;

UPDATE "shipments"
SET
  "cost" = COALESCE("cost", 0),
  "profit" = COALESCE("profit", 0),
  "margin_alert" = COALESCE("margin_alert", false)
WHERE
  "cost" IS NULL
  OR "profit" IS NULL
  OR "margin_alert" IS NULL;
