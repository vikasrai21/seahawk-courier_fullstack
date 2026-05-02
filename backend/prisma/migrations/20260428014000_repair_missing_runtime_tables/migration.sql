-- Repair migration for runtime tables/models that exist in schema.prisma
-- but are missing from older deployed databases.

CREATE TABLE IF NOT EXISTS "client_api_keys" (
  "id" SERIAL NOT NULL,
  "client_code" VARCHAR(20) NOT NULL,
  "name" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "last_used_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "client_api_keys_token_hash_key" ON "client_api_keys"("token_hash");
CREATE INDEX IF NOT EXISTS "client_api_keys_client_code_idx" ON "client_api_keys"("client_code");
CREATE INDEX IF NOT EXISTS "client_api_keys_token_hash_idx" ON "client_api_keys"("token_hash");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_api_keys_client_code_fkey'
  ) THEN
    ALTER TABLE "client_api_keys"
      ADD CONSTRAINT "client_api_keys_client_code_fkey"
      FOREIGN KEY ("client_code") REFERENCES "clients"("code")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "delhivery_pincodes" (
  "id" SERIAL NOT NULL,
  "pincode" TEXT NOT NULL,
  "oda" BOOLEAN NOT NULL DEFAULT false,
  "facility_city" TEXT,
  "facility_state" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "delhivery_pincodes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "delhivery_pincodes_pincode_key" ON "delhivery_pincodes"("pincode");
CREATE INDEX IF NOT EXISTS "delhivery_pincodes_pincode_idx" ON "delhivery_pincodes"("pincode");

CREATE TABLE IF NOT EXISTS "scan_corrections" (
  "id" SERIAL NOT NULL,
  "field" TEXT NOT NULL,
  "original" TEXT NOT NULL,
  "corrected" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "scan_corrections_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "scan_corrections_field_original_key" ON "scan_corrections"("field", "original");
CREATE INDEX IF NOT EXISTS "scan_corrections_field_idx" ON "scan_corrections"("field");
CREATE INDEX IF NOT EXISTS "scan_corrections_count_idx" ON "scan_corrections"("count");

CREATE TABLE IF NOT EXISTS "draft_orders" (
  "id" SERIAL NOT NULL,
  "client_code" VARCHAR(20) NOT NULL,
  "reference_id" TEXT,
  "consignee" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "phone" TEXT,
  "pincode" TEXT,
  "weight" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "shipment_id" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "draft_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "draft_orders_shipment_id_key" ON "draft_orders"("shipment_id");
CREATE INDEX IF NOT EXISTS "draft_orders_client_code_idx" ON "draft_orders"("client_code");
CREATE INDEX IF NOT EXISTS "draft_orders_status_idx" ON "draft_orders"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'draft_orders_client_code_fkey'
  ) THEN
    ALTER TABLE "draft_orders"
      ADD CONSTRAINT "draft_orders_client_code_fkey"
      FOREIGN KEY ("client_code") REFERENCES "clients"("code")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'draft_orders_shipment_id_fkey'
  ) THEN
    ALTER TABLE "draft_orders"
      ADD CONSTRAINT "draft_orders_shipment_id_fkey"
      FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "agent_memories" (
  "id" SERIAL NOT NULL,
  "category" TEXT NOT NULL,
  "context_key" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "metadata" JSONB,
  "frequency" INTEGER NOT NULL DEFAULT 1,
  "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_memories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "agent_memories_category_context_key_decision_key" ON "agent_memories"("category", "context_key", "decision");
CREATE INDEX IF NOT EXISTS "agent_memories_category_idx" ON "agent_memories"("category");
CREATE INDEX IF NOT EXISTS "agent_memories_frequency_idx" ON "agent_memories"("frequency");

CREATE TABLE IF NOT EXISTS "agent_action_logs" (
  "id" SERIAL NOT NULL,
  "action_type" TEXT NOT NULL,
  "params" JSONB NOT NULL,
  "result" JSONB,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "executed_by" TEXT NOT NULL DEFAULT 'AGENT',
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "owner_approved" BOOLEAN NOT NULL DEFAULT false,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "agent_action_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "agent_action_logs_action_type_idx" ON "agent_action_logs"("action_type");
CREATE INDEX IF NOT EXISTS "agent_action_logs_status_idx" ON "agent_action_logs"("status");
CREATE INDEX IF NOT EXISTS "agent_action_logs_created_at_idx" ON "agent_action_logs"("created_at");

CREATE TABLE IF NOT EXISTS "client_webhooks" (
  "id" SERIAL NOT NULL,
  "client_code" VARCHAR(20) NOT NULL,
  "url" TEXT NOT NULL,
  "secret" TEXT NOT NULL,
  "events" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "active" BOOLEAN NOT NULL DEFAULT true,
  "description" TEXT,
  "last_delivery" TIMESTAMP(3),
  "fail_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_webhooks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "client_webhooks_client_code_idx" ON "client_webhooks"("client_code");
CREATE INDEX IF NOT EXISTS "client_webhooks_active_idx" ON "client_webhooks"("active");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_webhooks_client_code_fkey'
  ) THEN
    ALTER TABLE "client_webhooks"
      ADD CONSTRAINT "client_webhooks_client_code_fkey"
      FOREIGN KEY ("client_code") REFERENCES "clients"("code")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
  "id" SERIAL NOT NULL,
  "webhook_id" INTEGER NOT NULL,
  "event" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status_code" INTEGER,
  "response" TEXT,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "max_attempts" INTEGER NOT NULL DEFAULT 5,
  "next_retry_at" TIMESTAMP(3),
  "error" TEXT,
  "delivered_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "webhook_deliveries_webhook_id_idx" ON "webhook_deliveries"("webhook_id");
CREATE INDEX IF NOT EXISTS "webhook_deliveries_success_idx" ON "webhook_deliveries"("success");
CREATE INDEX IF NOT EXISTS "webhook_deliveries_next_retry_at_idx" ON "webhook_deliveries"("next_retry_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'webhook_deliveries_webhook_id_fkey'
  ) THEN
    ALTER TABLE "webhook_deliveries"
      ADD CONSTRAINT "webhook_deliveries_webhook_id_fkey"
      FOREIGN KEY ("webhook_id") REFERENCES "client_webhooks"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
