-- Group member reports (to group owner) + immutable admin operation audit

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

-- Append-only: block UPDATE/DELETE at DB level
CREATE OR REPLACE FUNCTION prevent_admin_operation_audit_mutation()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'admin_operation_audit_logs is append-only and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_op_audit_no_update ON admin_operation_audit_logs;
CREATE TRIGGER trg_admin_op_audit_no_update
    BEFORE UPDATE OR DELETE ON admin_operation_audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_admin_operation_audit_mutation();
