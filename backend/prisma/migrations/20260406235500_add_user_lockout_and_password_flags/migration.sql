ALTER TABLE "users"
ADD COLUMN "login_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "locked_until" TIMESTAMP(3),
ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT false;
