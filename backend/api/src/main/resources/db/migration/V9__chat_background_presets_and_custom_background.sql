ALTER TABLE chat_room_user_settings
    ADD COLUMN IF NOT EXISTS background_image_url TEXT;

CREATE TABLE IF NOT EXISTS chat_background_presets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    image_url TEXT NOT NULL,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_background_presets_active
    ON chat_background_presets(is_active);
