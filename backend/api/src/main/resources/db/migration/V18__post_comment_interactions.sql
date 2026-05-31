ALTER TABLE post_comments
    ADD COLUMN IF NOT EXISTS parent_comment_id BIGINT REFERENCES post_comments(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS post_comment_likes (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_comments_parent_comment_id ON post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_post_comment_likes_comment_id ON post_comment_likes(comment_id);
