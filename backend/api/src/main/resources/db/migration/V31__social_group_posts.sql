CREATE TABLE IF NOT EXISTS social_group_posts (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL,
    author_user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'APPROVED',
    reviewed_by BIGINT NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_social_group_posts_group FOREIGN KEY (group_id) REFERENCES social_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_social_group_posts_author FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_social_group_posts_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_social_group_posts_group_status_created
    ON social_group_posts (group_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_group_posts_author_created
    ON social_group_posts (author_user_id, created_at DESC);
