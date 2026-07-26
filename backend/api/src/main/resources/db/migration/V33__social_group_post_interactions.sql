CREATE TABLE IF NOT EXISTS social_group_post_likes (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_sgpl_post FOREIGN KEY (post_id) REFERENCES social_group_posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_sgpl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_sgpl_post_user UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_sgpl_post ON social_group_post_likes (post_id);

CREATE TABLE IF NOT EXISTS social_group_post_comments (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_sgpc_post FOREIGN KEY (post_id) REFERENCES social_group_posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_sgpc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sgpc_post_created
    ON social_group_post_comments (post_id, created_at ASC);
