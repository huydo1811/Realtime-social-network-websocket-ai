CREATE TABLE IF NOT EXISTS chat_room_user_settings (
    room_id BIGINT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(120),
    bubble_theme VARCHAR(20) NOT NULL DEFAULT 'ROSE',
    background_theme VARCHAR(20) NOT NULL DEFAULT 'PLAIN',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_room_user_settings_user
    ON chat_room_user_settings(user_id);
