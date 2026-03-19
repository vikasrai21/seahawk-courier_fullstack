-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "branch" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "client_code" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "company" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "gst" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "wallet_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" SERIAL NOT NULL,
    "client_code" VARCHAR(20) NOT NULL,
    "name" TEXT NOT NULL,
    "courier" TEXT,
    "service" TEXT,
    "pricing_type" TEXT NOT NULL DEFAULT 'PER_KG',
    "base_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "min_charge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fuel_surcharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gst_percent" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "valid_from" TEXT,
    "valid_to" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" SERIAL NOT NULL,
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
    "label_url" TEXT,
    "created_by_id" INTEGER,
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_events" (
    "id" SERIAL NOT NULL,
    "shipment_id" INTEGER NOT NULL,
    "awb" VARCHAR(50) NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT DEFAULT '',
    "description" TEXT DEFAULT '',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "raw_data" JSONB,

    CONSTRAINT "tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ndr_events" (
    "id" SERIAL NOT NULL,
    "shipment_id" INTEGER NOT NULL,
    "awb" VARCHAR(50) NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "attempt_no" INTEGER NOT NULL DEFAULT 1,
    "action" TEXT NOT NULL DEFAULT 'PENDING',
    "new_address" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ndr_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_requests" (
    "id" SERIAL NOT NULL,
    "request_no" VARCHAR(30) NOT NULL,
    "client_code" VARCHAR(20),
    "contact_name" TEXT NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "contact_email" TEXT,
    "pickup_address" TEXT NOT NULL,
    "pickup_city" TEXT NOT NULL,
    "pickup_pin" TEXT NOT NULL,
    "delivery_address" TEXT,
    "delivery_city" TEXT,
    "delivery_state" TEXT,
    "delivery_country" TEXT NOT NULL DEFAULT 'India',
    "package_type" TEXT NOT NULL DEFAULT 'Parcel',
    "weight_grams" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pieces" INTEGER NOT NULL DEFAULT 1,
    "service" TEXT NOT NULL DEFAULT 'Standard',
    "declared_value" DOUBLE PRECISION,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'PORTAL',
    "preferred_carrier" TEXT,
    "scheduled_date" TEXT NOT NULL,
    "time_slot" TEXT NOT NULL,
    "assigned_agent_id" INTEGER,
    "assigned_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pickup_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" SERIAL NOT NULL,
    "client_code" VARCHAR(20) NOT NULL,
    "user_id" INTEGER,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "payment_mode" TEXT,
    "payment_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "invoice_no" TEXT NOT NULL,
    "client_code" VARCHAR(20) NOT NULL,
    "from_date" TEXT NOT NULL,
    "to_date" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gst_percent" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "gst_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "pdf_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "shipment_id" INTEGER NOT NULL,
    "awb" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "consignee" TEXT,
    "destination" TEXT,
    "courier" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "base_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fuel_surcharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "user_email" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_value" JSONB,
    "new_value" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" SERIAL NOT NULL,
    "quote_no" TEXT NOT NULL,
    "client_code" VARCHAR(20),
    "destination" TEXT NOT NULL,
    "pincode" TEXT,
    "state" TEXT,
    "district" TEXT,
    "ship_type" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "courier" TEXT NOT NULL,
    "courier_mode" TEXT NOT NULL,
    "cost_total" DOUBLE PRECISION NOT NULL,
    "sell_total" DOUBLE PRECISION NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUOTED',
    "valid_until" TEXT,
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courier_invoices" (
    "id" SERIAL NOT NULL,
    "courier" TEXT NOT NULL,
    "invoice_no" TEXT NOT NULL,
    "invoice_date" TEXT NOT NULL,
    "from_date" TEXT NOT NULL,
    "to_date" TEXT NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "uploaded_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courier_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courier_invoice_items" (
    "id" SERIAL NOT NULL,
    "courier_invoice_id" INTEGER NOT NULL,
    "awb" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "destination" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "billed_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculated_amount" DOUBLE PRECISION DEFAULT 0,
    "discrepancy" DOUBLE PRECISION DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OK',
    "notes" TEXT,

    CONSTRAINT "courier_invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "margin_rules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "courier" TEXT,
    "zone" TEXT,
    "ship_type" TEXT,
    "min_margin_pct" DOUBLE PRECISION NOT NULL,
    "min_profit_abs" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "margin_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_versions" (
    "id" SERIAL NOT NULL,
    "courier" TEXT NOT NULL,
    "effective_date" TEXT NOT NULL,
    "uploaded_by_id" INTEGER,
    "notes" TEXT,
    "data_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "client_code" VARCHAR(20),
    "awb" VARCHAR(50),
    "channel" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "provider" TEXT,
    "provider_ref" TEXT,
    "error" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_queue" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "run_after" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_client_code_idx" ON "users"("client_code");

-- CreateIndex
CREATE UNIQUE INDEX "clients_code_key" ON "clients"("code");

-- CreateIndex
CREATE INDEX "clients_code_idx" ON "clients"("code");

-- CreateIndex
CREATE INDEX "contracts_client_code_idx" ON "contracts"("client_code");

-- CreateIndex
CREATE INDEX "contracts_active_idx" ON "contracts"("active");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_awb_key" ON "shipments"("awb");

-- CreateIndex
CREATE INDEX "shipments_date_idx" ON "shipments"("date");

-- CreateIndex
CREATE INDEX "shipments_client_code_idx" ON "shipments"("client_code");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX "shipments_courier_idx" ON "shipments"("courier");

-- CreateIndex
CREATE INDEX "shipments_ndr_status_idx" ON "shipments"("ndr_status");

-- CreateIndex
CREATE INDEX "shipments_date_client_code_idx" ON "shipments"("date", "client_code");

-- CreateIndex
CREATE INDEX "tracking_events_shipment_id_idx" ON "tracking_events"("shipment_id");

-- CreateIndex
CREATE INDEX "tracking_events_awb_idx" ON "tracking_events"("awb");

-- CreateIndex
CREATE INDEX "tracking_events_timestamp_idx" ON "tracking_events"("timestamp");

-- CreateIndex
CREATE INDEX "ndr_events_shipment_id_idx" ON "ndr_events"("shipment_id");

-- CreateIndex
CREATE INDEX "ndr_events_awb_idx" ON "ndr_events"("awb");

-- CreateIndex
CREATE INDEX "ndr_events_action_idx" ON "ndr_events"("action");

-- CreateIndex
CREATE UNIQUE INDEX "pickup_requests_request_no_key" ON "pickup_requests"("request_no");

-- CreateIndex
CREATE INDEX "pickup_requests_status_idx" ON "pickup_requests"("status");

-- CreateIndex
CREATE INDEX "pickup_requests_scheduled_date_idx" ON "pickup_requests"("scheduled_date");

-- CreateIndex
CREATE INDEX "pickup_requests_client_code_idx" ON "pickup_requests"("client_code");

-- CreateIndex
CREATE INDEX "wallet_transactions_client_code_idx" ON "wallet_transactions"("client_code");

-- CreateIndex
CREATE INDEX "wallet_transactions_created_at_idx" ON "wallet_transactions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_no_key" ON "invoices"("invoice_no");

-- CreateIndex
CREATE INDEX "invoices_client_code_idx" ON "invoices"("client_code");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_from_date_to_date_idx" ON "invoices"("from_date", "to_date");

-- CreateIndex
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_quote_no_key" ON "quotes"("quote_no");

-- CreateIndex
CREATE INDEX "quotes_client_code_idx" ON "quotes"("client_code");

-- CreateIndex
CREATE INDEX "quotes_status_idx" ON "quotes"("status");

-- CreateIndex
CREATE INDEX "quotes_created_at_idx" ON "quotes"("created_at");

-- CreateIndex
CREATE INDEX "courier_invoices_courier_idx" ON "courier_invoices"("courier");

-- CreateIndex
CREATE INDEX "courier_invoices_status_idx" ON "courier_invoices"("status");

-- CreateIndex
CREATE INDEX "courier_invoice_items_courier_invoice_id_idx" ON "courier_invoice_items"("courier_invoice_id");

-- CreateIndex
CREATE INDEX "courier_invoice_items_awb_idx" ON "courier_invoice_items"("awb");

-- CreateIndex
CREATE INDEX "rate_versions_courier_idx" ON "rate_versions"("courier");

-- CreateIndex
CREATE INDEX "notifications_awb_idx" ON "notifications"("awb");

-- CreateIndex
CREATE INDEX "notifications_client_code_idx" ON "notifications"("client_code");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "job_queue_status_run_after_idx" ON "job_queue"("status", "run_after");

-- CreateIndex
CREATE INDEX "job_queue_type_idx" ON "job_queue"("type");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_client_code_fkey" FOREIGN KEY ("client_code") REFERENCES "clients"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_client_code_fkey" FOREIGN KEY ("client_code") REFERENCES "clients"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_events" ADD CONSTRAINT "tracking_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ndr_events" ADD CONSTRAINT "ndr_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_requests" ADD CONSTRAINT "pickup_requests_client_code_fkey" FOREIGN KEY ("client_code") REFERENCES "clients"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_requests" ADD CONSTRAINT "pickup_requests_assigned_agent_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_client_code_fkey" FOREIGN KEY ("client_code") REFERENCES "clients"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_code_fkey" FOREIGN KEY ("client_code") REFERENCES "clients"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_code_fkey" FOREIGN KEY ("client_code") REFERENCES "clients"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_invoices" ADD CONSTRAINT "courier_invoices_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courier_invoice_items" ADD CONSTRAINT "courier_invoice_items_courier_invoice_id_fkey" FOREIGN KEY ("courier_invoice_id") REFERENCES "courier_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_versions" ADD CONSTRAINT "rate_versions_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
