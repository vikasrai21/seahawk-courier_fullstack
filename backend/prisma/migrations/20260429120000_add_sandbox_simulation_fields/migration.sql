ALTER TABLE "shipments"
  ADD COLUMN IF NOT EXISTS "environment" VARCHAR(20) NOT NULL DEFAULT 'production',
  ADD COLUMN IF NOT EXISTS "sandbox_run_id" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "source_platform" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "simulation_state" JSONB;

CREATE INDEX IF NOT EXISTS "shipments_environment_idx" ON "shipments"("environment");
CREATE INDEX IF NOT EXISTS "shipments_sandbox_run_id_idx" ON "shipments"("sandbox_run_id");
CREATE INDEX IF NOT EXISTS "shipments_source_platform_idx" ON "shipments"("source_platform");

ALTER TABLE "draft_orders"
  ADD COLUMN IF NOT EXISTS "environment" VARCHAR(20) NOT NULL DEFAULT 'production',
  ADD COLUMN IF NOT EXISTS "sandbox_run_id" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "source_platform" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "simulation_state" JSONB;

CREATE INDEX IF NOT EXISTS "draft_orders_environment_idx" ON "draft_orders"("environment");
CREATE INDEX IF NOT EXISTS "draft_orders_sandbox_run_id_idx" ON "draft_orders"("sandbox_run_id");
CREATE INDEX IF NOT EXISTS "draft_orders_source_platform_idx" ON "draft_orders"("source_platform");

CREATE TABLE IF NOT EXISTS "sandbox_runs" (
  "id" SERIAL PRIMARY KEY,
  "run_id" VARCHAR(50) NOT NULL UNIQUE,
  "client_code" VARCHAR(20),
  "platform_type" VARCHAR(30),
  "total_orders" INTEGER NOT NULL DEFAULT 0,
  "total_shipments" INTEGER NOT NULL DEFAULT 0,
  "failed_orders" INTEGER NOT NULL DEFAULT 0,
  "status" VARCHAR(20) NOT NULL DEFAULT 'success',
  "orders" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "shipments" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "errors" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "status_progression" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "logs" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "sandbox_runs_client_code_idx" ON "sandbox_runs"("client_code");
CREATE INDEX IF NOT EXISTS "sandbox_runs_platform_type_idx" ON "sandbox_runs"("platform_type");
CREATE INDEX IF NOT EXISTS "sandbox_runs_status_idx" ON "sandbox_runs"("status");
CREATE INDEX IF NOT EXISTS "sandbox_runs_created_at_idx" ON "sandbox_runs"("created_at");
