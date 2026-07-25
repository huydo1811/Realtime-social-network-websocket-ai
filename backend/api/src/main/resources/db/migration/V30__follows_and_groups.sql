CREATE TABLE IF NOT EXISTS user_follows (
    id BIGSERIAL PRIMARY KEY,
    follower_user_id BIGINT NOT NULL,
    followee_user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user_follows_follower FOREIGN KEY (follower_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_follows_followee FOREIGN KEY (followee_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT ck_user_follows_no_self CHECK (follower_user_id <> followee_user_id),
    CONSTRAINT uk_user_follows_pair UNIQUE (follower_user_id, followee_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_created
    ON user_follows (follower_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_follows_followee_created
    ON user_follows (followee_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS social_groups (
    id BIGSERIAL PRIMARY KEY,
    owner_user_id BIGINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT NULL,
    visibility VARCHAR(16) NOT NULL DEFAULT 'PUBLIC',
    require_approval BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_social_groups_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_social_groups_owner_created
    ON social_groups (owner_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS social_group_memberships (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'MEMBER',
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
    handled_at TIMESTAMP NULL,
    handled_by BIGINT NULL,
    joined_at TIMESTAMP NULL,
    CONSTRAINT fk_social_group_memberships_group FOREIGN KEY (group_id) REFERENCES social_groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_social_group_memberships_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_social_group_memberships_handler FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_social_group_membership_user UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_social_group_memberships_group_status
    ON social_group_memberships (group_id, status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_group_memberships_user_status
    ON social_group_memberships (user_id, status, requested_at DESC);
