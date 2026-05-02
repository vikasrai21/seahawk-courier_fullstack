CREATE INDEX IF NOT EXISTS "shipments_created_at_idx" ON "shipments"("created_at");
CREATE INDEX IF NOT EXISTS "shipments_created_at_id_idx" ON "shipments"("created_at", "id");
CREATE INDEX IF NOT EXISTS "shipments_status_date_idx" ON "shipments"("status", "date");
CREATE INDEX IF NOT EXISTS "shipments_client_status_date_idx" ON "shipments"("client_code", "status", "date");
