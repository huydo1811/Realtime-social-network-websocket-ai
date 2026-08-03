-- Ensure group member reports + admin audit tables exist (idempotent repair)

CREATE TABLE IF NOT EXISTS group_member_reports (
    id                  BIGSERIAL PRIMARY KEY,
    group_id            BIGINT NOT NULL REFERENCES social_groups(id) ON DELETE CASCADE,
    reported_user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reporter_user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason              TEXT NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    owner_note          TEXT,
    resolved_at         TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_group_member_reports_group
    ON group_member_reports(group_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_group_member_reports_status
    ON group_member_reports(group_id, status);

CREATE TABLE IF NOT EXISTS admin_operation_audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    admin_user_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action          VARCHAR(128) NOT NULL,
    resource_type   VARCHAR(64),
    resource_id     VARCHAR(64),
    detail          TEXT,
    request_path    VARCHAR(512),
    http_method     VARCHAR(16),
    ip_address      VARCHAR(64),
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_op_audit_created
    ON admin_operation_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_op_audit_admin
    ON admin_operation_audit_logs(admin_user_id);
