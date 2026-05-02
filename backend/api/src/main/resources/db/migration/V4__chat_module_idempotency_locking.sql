ALTER TABLE chat_rooms
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100),
    ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

ALTER TABLE chat_messages
    ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_rooms_idempotency
    ON chat_rooms (idempotency_key)
    WHERE idempotency_key IS NOT NULL;
