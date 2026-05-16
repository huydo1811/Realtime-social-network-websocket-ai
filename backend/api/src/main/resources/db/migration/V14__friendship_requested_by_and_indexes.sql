ALTER TABLE friendships
    ADD COLUMN IF NOT EXISTS requested_by BIGINT REFERENCES users(id) ON DELETE CASCADE;

UPDATE friendships
SET requested_by = COALESCE(requested_by, user_id1)
WHERE requested_by IS NULL;

ALTER TABLE friendships
    ALTER COLUMN requested_by SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_requested_by ON friendships(requested_by);
