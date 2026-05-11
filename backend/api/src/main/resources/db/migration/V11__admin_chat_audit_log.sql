CREATE TABLE IF NOT EXISTS admin_chat_audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    admin_user_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action          VARCHAR(64) NOT NULL,
    reason          TEXT,
    conversation_id BIGINT,
    message_id      BIGINT,
    detail          TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_chat_audit_created
    ON admin_chat_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_chat_audit_admin
    ON admin_chat_audit_logs(admin_user_id);
