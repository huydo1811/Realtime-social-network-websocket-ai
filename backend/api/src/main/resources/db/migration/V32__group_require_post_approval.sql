ALTER TABLE social_groups
    ADD COLUMN IF NOT EXISTS require_post_approval BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN social_groups.require_approval IS 'Require owner approval for join requests (public groups).';
COMMENT ON COLUMN social_groups.require_post_approval IS 'Require owner approval before member posts appear in group feed.';
