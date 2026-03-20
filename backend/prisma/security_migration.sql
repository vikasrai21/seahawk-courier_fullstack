-- Security migration — run this in Railway Database Query tab
-- Adds account lockout fields, OTP table, and must-change-password flag

-- Add lockout fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Create OTP table for email 2FA
CREATE TABLE IF NOT EXISTS login_otps (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(255) NOT NULL,
  otp        VARCHAR(10)  NOT NULL,
  expires_at TIMESTAMP    NOT NULL,
  used       BOOLEAN      DEFAULT false,
  attempts   INT          DEFAULT 0,
  created_at TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_otps_email      ON login_otps(email);
CREATE INDEX IF NOT EXISTS idx_login_otps_expires_at ON login_otps(expires_at);

-- Force admin to change password on next login (security best practice)
UPDATE users SET must_change_password = true WHERE role = 'ADMIN';
