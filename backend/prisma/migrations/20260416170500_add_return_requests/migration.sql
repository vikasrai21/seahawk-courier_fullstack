CREATE TABLE IF NOT EXISTS "return_requests" (
    "id" SERIAL NOT NULL,
    "shipment_id" INTEGER NOT NULL,
    "original_awb" VARCHAR(50) NOT NULL,
    "client_code" VARCHAR(20) NOT NULL,
    "reason" TEXT NOT NULL,
    "reason_detail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reverse_awb" VARCHAR(50),
    "reverse_courier" TEXT,
    "pickup_address" TEXT,
    "pickup_city" TEXT,
    "pickup_state" TEXT,
    "pickup_pincode" VARCHAR(10),
    "pickup_phone" TEXT,
    "pickup_date" VARCHAR(10),
    "label_url" TEXT,
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "return_requests_client_code_idx" ON "return_requests"("client_code");
CREATE INDEX IF NOT EXISTS "return_requests_status_idx" ON "return_requests"("status");
CREATE INDEX IF NOT EXISTS "return_requests_original_awb_idx" ON "return_requests"("original_awb");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'return_requests_shipment_id_fkey'
    ) THEN
        ALTER TABLE "return_requests"
        ADD CONSTRAINT "return_requests_shipment_id_fkey"
        FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'return_requests_client_code_fkey'
    ) THEN
        ALTER TABLE "return_requests"
        ADD CONSTRAINT "return_requests_client_code_fkey"
        FOREIGN KEY ("client_code") REFERENCES "clients"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
