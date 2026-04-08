ALTER TABLE otps ADD COLUMN IF NOT EXISTS purpose VARCHAR(20) NOT NULL DEFAULT 'REGISTER';
ALTER TABLE otps ADD COLUMN IF NOT EXISTS session_token_hash VARCHAR(255);
ALTER TABLE otps ADD COLUMN IF NOT EXISTS session_expires_at TIMESTAMP;
ALTER TABLE otps ADD COLUMN IF NOT EXISTS session_used BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE otps ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_otps_verify
ON otps(contact, contact_type, purpose, used, created_at);

CREATE INDEX IF NOT EXISTS idx_otps_session
ON otps(contact, contact_type, purpose, session_used, session_expires_at);