-- ============================================================================
-- V28: Moderation audit + model versions
-- ============================================================================
-- Records every moderation inference call. Used by admin review and by
-- future retraining feedback loops.

CREATE TABLE IF NOT EXISTS moderation_audit (
    id                  BIGSERIAL    PRIMARY KEY,
    target_type         VARCHAR(20)  NOT NULL,
    target_id           BIGINT       NOT NULL,
    author_user_id      BIGINT       NOT NULL,
    content_hash        VARCHAR(64)  NOT NULL,
    content_preview     VARCHAR(500),
    model_name          VARCHAR(80)  NOT NULL,
    model_version       VARCHAR(40)  NOT NULL,
    score               NUMERIC(5,4) NOT NULL,
    threshold_allow     NUMERIC(5,4),
    threshold_reject    NUMERIC(5,4),
    source              VARCHAR(20)  NOT NULL,
    action              VARCHAR(20)  NOT NULL,
    inference_ms        BIGINT       NOT NULL DEFAULT 0,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_moderation_audit_target_type CHECK (target_type IN ('POST', 'COMMENT')),
    CONSTRAINT chk_moderation_audit_source CHECK (source IN ('AI', 'FALLBACK')),
    CONSTRAINT chk_moderation_audit_action CHECK (action IN ('ALLOW', 'SOFT_HIDE', 'HARD_REJECT', 'FALLBACK'))
);

CREATE INDEX IF NOT EXISTS idx_moderation_audit_target
    ON moderation_audit (target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_moderation_audit_author_created
    ON moderation_audit (author_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_audit_score_created
    ON moderation_audit (score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_audit_action_created
    ON moderation_audit (action, created_at DESC);

-- ----------------------------------------------------------------------------
-- Active model registry (used for audit + dynamic hot-reload later).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS moderation_model_versions (
    id                  BIGSERIAL    PRIMARY KEY,
    version             VARCHAR(40)  NOT NULL UNIQUE,
    model_name          VARCHAR(80)  NOT NULL,
    file_path           VARCHAR(500) NOT NULL,
    sha256              VARCHAR(64)  NOT NULL,
    threshold_allow     NUMERIC(5,4) NOT NULL DEFAULT 0.5,
    threshold_reject    NUMERIC(5,4) NOT NULL DEFAULT 0.85,
    is_active           BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    activated_at        TIMESTAMP
);

-- At most one active model.
CREATE UNIQUE INDEX IF NOT EXISTS uq_moderation_model_versions_active
    ON moderation_model_versions (is_active)
    WHERE is_active = TRUE;

-- Seed the active phobert_v1 model so admins can audit it.
INSERT INTO moderation_model_versions
    (version, model_name, file_path, sha256, threshold_allow, threshold_reject, is_active, activated_at)
VALUES
    ('v1', 'phobert_v1', '/workspace/artifacts/phobert_v1', 'pending', 0.50, 0.85, TRUE, NOW())
ON CONFLICT (version) DO NOTHING;