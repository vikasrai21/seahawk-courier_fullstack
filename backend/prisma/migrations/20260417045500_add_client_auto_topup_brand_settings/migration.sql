ALTER TABLE "clients"
ADD COLUMN IF NOT EXISTS "auto_topup_rule" JSONB,
ADD COLUMN IF NOT EXISTS "brand_settings" JSONB;
