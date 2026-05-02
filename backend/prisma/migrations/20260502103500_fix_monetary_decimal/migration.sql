-- Fix monetary fields: Float → Decimal(12,2)
-- This migration converts all monetary/financial fields from DOUBLE PRECISION
-- to DECIMAL(12,2) to prevent floating-point rounding errors in billing.

-- AlterTable: clients
ALTER TABLE "clients" ALTER COLUMN "wallet_balance" SET DATA TYPE DECIMAL(12,2);

-- AlterTable: contracts
ALTER TABLE "contracts" ALTER COLUMN "base_rate" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "min_charge" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "fuel_surcharge" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "base_charge" SET DATA TYPE DECIMAL(12,2);

-- AlterTable: courier_invoice_items
ALTER TABLE "courier_invoice_items" ALTER COLUMN "billed_amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "calculated_amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "discrepancy" SET DATA TYPE DECIMAL(12,2);

-- AlterTable: invoice_items
ALTER TABLE "invoice_items" ALTER COLUMN "base_amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "fuel_surcharge" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable: invoices
ALTER TABLE "invoices" ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "gst_amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "cgst_amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "igst_amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "sgst_amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable: margin_rules
ALTER TABLE "margin_rules" ALTER COLUMN "min_margin_pct" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "min_profit_abs" SET DATA TYPE DECIMAL(12,2);

-- AlterTable: pickup_requests
ALTER TABLE "pickup_requests" ALTER COLUMN "weight_grams" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "declared_value" SET DATA TYPE DECIMAL(12,2);

-- AlterTable: quotes
ALTER TABLE "quotes" ALTER COLUMN "cost_total" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "sell_total" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "profit" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "margin" SET DATA TYPE DECIMAL(12,2);

-- AlterTable: shipments
ALTER TABLE "shipments" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "cost" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "profit" SET DATA TYPE DECIMAL(12,2);

-- AlterTable: wallet_transactions
ALTER TABLE "wallet_transactions" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "balance" SET DATA TYPE DECIMAL(12,2);
