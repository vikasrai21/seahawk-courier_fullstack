-- Complete financial precision migration and shipment query indexes.
-- The schema already expects these fields as Decimal; this makes deployed
-- databases match it and removes the last Float-backed billing/reconciliation fields.

ALTER TABLE "contracts"
  ALTER COLUMN "gst_percent" SET DATA TYPE DECIMAL(12,4);

ALTER TABLE "shipments"
  ALTER COLUMN "weight" SET DATA TYPE DECIMAL(12,4);

ALTER TABLE "shipment_import_rows"
  ALTER COLUMN "weight" SET DATA TYPE DECIMAL(12,4);

ALTER TABLE "invoice_items"
  ALTER COLUMN "weight" SET DATA TYPE DECIMAL(12,4);

ALTER TABLE "quotes"
  ALTER COLUMN "weight" SET DATA TYPE DECIMAL(12,4);

ALTER TABLE "courier_invoices"
  ALTER COLUMN "total_amount" SET DATA TYPE DECIMAL(12,4);

ALTER TABLE "courier_invoice_items"
  ALTER COLUMN "weight" SET DATA TYPE DECIMAL(12,4);

CREATE INDEX IF NOT EXISTS "shipments_date_status_environment_idx"
  ON "shipments"("date", "status", "environment");
