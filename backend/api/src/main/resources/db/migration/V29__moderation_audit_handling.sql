ALTER TABLE moderation_audit
    ADD COLUMN IF NOT EXISTS handled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE moderation_audit
    ADD COLUMN IF NOT EXISTS handled_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_moderation_audit_handled_created
    ON moderation_audit (handled, created_at DESC);
