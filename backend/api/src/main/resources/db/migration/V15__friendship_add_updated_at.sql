ALTER TABLE friendships
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

UPDATE friendships
SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
WHERE updated_at IS NULL;

ALTER TABLE friendships
    ALTER COLUMN updated_at SET NOT NULL;
