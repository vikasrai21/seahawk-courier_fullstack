ALTER TABLE "return_requests"
ADD COLUMN IF NOT EXISTS "return_method" TEXT;

UPDATE "return_requests"
SET "return_method" = 'PICKUP'
WHERE "return_method" IS NULL OR TRIM("return_method") = '';

ALTER TABLE "return_requests"
ALTER COLUMN "return_method" SET DEFAULT 'PICKUP';

ALTER TABLE "return_requests"
ALTER COLUMN "return_method" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "return_requests_return_method_idx"
ON "return_requests"("return_method");
