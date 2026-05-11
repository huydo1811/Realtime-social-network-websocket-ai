ALTER TABLE chat_background_presets
    ADD COLUMN IF NOT EXISTS origin VARCHAR(20) NOT NULL DEFAULT 'ADMIN';

CREATE INDEX IF NOT EXISTS idx_chat_background_presets_origin_active
    ON chat_background_presets(origin, is_active);
