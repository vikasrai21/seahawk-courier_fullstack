CREATE TABLE IF NOT EXISTS "shipment_import_rows" (
    "id" SERIAL NOT NULL,
    "batch_key" TEXT NOT NULL,
    "source_file" TEXT,
    "source_sheet" TEXT,
    "row_no" INTEGER,
    "date" VARCHAR(10) NOT NULL,
    "client_code" VARCHAR(20) NOT NULL,
    "awb" VARCHAR(50) NOT NULL,
    "consignee" TEXT,
    "destination" TEXT,
    "phone" TEXT,
    "pincode" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "courier" TEXT,
    "department" TEXT,
    "service" TEXT NOT NULL DEFAULT 'Standard',
    "status" TEXT NOT NULL DEFAULT 'Booked',
    "ndr_status" TEXT,
    "remarks" TEXT,
    "auto_priced" BOOLEAN NOT NULL DEFAULT FALSE,
    "shipment_id" INTEGER,
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_import_rows_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "shipment_import_rows_batch_key_idx" ON "shipment_import_rows"("batch_key");
CREATE INDEX IF NOT EXISTS "shipment_import_rows_date_idx" ON "shipment_import_rows"("date");
CREATE INDEX IF NOT EXISTS "shipment_import_rows_client_code_idx" ON "shipment_import_rows"("client_code");
CREATE INDEX IF NOT EXISTS "shipment_import_rows_awb_idx" ON "shipment_import_rows"("awb");
CREATE INDEX IF NOT EXISTS "shipment_import_rows_courier_idx" ON "shipment_import_rows"("courier");
CREATE INDEX IF NOT EXISTS "shipment_import_rows_status_idx" ON "shipment_import_rows"("status");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'shipment_import_rows_client_code_fkey'
    ) THEN
        ALTER TABLE "shipment_import_rows"
        ADD CONSTRAINT "shipment_import_rows_client_code_fkey"
        FOREIGN KEY ("client_code") REFERENCES "clients"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'shipment_import_rows_shipment_id_fkey'
    ) THEN
        ALTER TABLE "shipment_import_rows"
        ADD CONSTRAINT "shipment_import_rows_shipment_id_fkey"
        FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'shipment_import_rows_created_by_id_fkey'
    ) THEN
        ALTER TABLE "shipment_import_rows"
        ADD CONSTRAINT "shipment_import_rows_created_by_id_fkey"
        FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
