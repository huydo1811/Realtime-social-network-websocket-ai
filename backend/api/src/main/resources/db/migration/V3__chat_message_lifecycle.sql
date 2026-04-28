ALTER TABLE chat_messages
    ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100);

CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_messages_idempotency
    ON chat_messages (room_id, sender_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;
