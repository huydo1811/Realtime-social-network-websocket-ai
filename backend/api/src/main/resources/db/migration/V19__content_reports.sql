CREATE TABLE content_reports (
    id BIGSERIAL PRIMARY KEY,
    target_type VARCHAR(20) NOT NULL,
    target_id BIGINT NOT NULL,
    post_id BIGINT REFERENCES posts(id) ON DELETE SET NULL,
    reporter_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    admin_note TEXT,
    resolved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_reports_status_created ON content_reports(status, created_at DESC);
CREATE INDEX idx_content_reports_target ON content_reports(target_type, target_id);
