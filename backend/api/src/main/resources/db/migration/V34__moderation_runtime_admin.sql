-- Runtime AI settings + typed model registry for admin management UI.

ALTER TABLE moderation_model_versions
    ADD COLUMN IF NOT EXISTS model_type VARCHAR(16) NOT NULL DEFAULT 'TEXT';

ALTER TABLE moderation_model_versions
    DROP CONSTRAINT IF EXISTS chk_moderation_model_type;

ALTER TABLE moderation_model_versions
    ADD CONSTRAINT chk_moderation_model_type
        CHECK (model_type IN ('TEXT', 'IMAGE'));

DROP INDEX IF EXISTS uq_moderation_model_versions_active;

CREATE UNIQUE INDEX IF NOT EXISTS uq_moderation_model_versions_active_type
    ON moderation_model_versions (model_type)
    WHERE is_active = TRUE;

UPDATE moderation_model_versions
SET model_type = 'TEXT'
WHERE model_type IS NULL OR model_type = '';

INSERT INTO moderation_model_versions
    (version, model_name, file_path, sha256, threshold_allow, threshold_reject, is_active, activated_at, model_type)
VALUES
    (
        'img-v1',
        'pet_filter_efficientnet_b0',
        '/workspace/artifacts/image/best_pet_nonpet_efficientnet_b0.pth',
        'pending',
        0.60,
        0.60,
        TRUE,
        NOW(),
        'IMAGE'
    )
ON CONFLICT (version) DO NOTHING;

CREATE TABLE IF NOT EXISTS moderation_runtime_settings (
    id                      SMALLINT PRIMARY KEY DEFAULT 1,
    text_enabled            BOOLEAN NOT NULL DEFAULT TRUE,
    image_enabled           BOOLEAN NOT NULL DEFAULT TRUE,
    text_allow_threshold    NUMERIC(5,4) NOT NULL DEFAULT 0.50,
    text_reject_threshold   NUMERIC(5,4) NOT NULL DEFAULT 0.85,
    image_threshold         NUMERIC(5,4) NOT NULL DEFAULT 0.60,
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_moderation_runtime_settings_singleton CHECK (id = 1),
    CONSTRAINT chk_moderation_runtime_text_thresholds
        CHECK (text_reject_threshold > text_allow_threshold),
    CONSTRAINT chk_moderation_runtime_image_threshold
        CHECK (image_threshold >= 0 AND image_threshold <= 1)
);

INSERT INTO moderation_runtime_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
