-- 1. users
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),                    
    full_name       VARCHAR(100),
    bio             TEXT,
    avatar_url      TEXT,
    cover_url       TEXT,
    role            VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'MODERATOR')),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. posts
CREATE TABLE posts (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT REFERENCES users(id) ON DELETE CASCADE,
    content             TEXT,
    image_url           TEXT,
    video_url           TEXT,
    visibility          VARCHAR(20) DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'FRIENDS', 'PRIVATE')),
    moderation_status   VARCHAR(20) DEFAULT 'PENDING' CHECK (moderation_status IN ('PENDING', 'APPROVED', 'REJECTED', 'DELETED')),
    moderation_reason   TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. comments
CREATE TABLE comments (
    id                  BIGSERIAL PRIMARY KEY,
    post_id             BIGINT REFERENCES posts(id) ON DELETE CASCADE,
    parent_id           BIGINT REFERENCES comments(id) ON DELETE CASCADE,  -- cho reply
    user_id             BIGINT REFERENCES users(id) ON DELETE CASCADE,
    content             TEXT NOT NULL,
    moderation_status   VARCHAR(20) DEFAULT 'PENDING',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. reactions 
CREATE TABLE reactions (
    id          BIGSERIAL PRIMARY KEY,
    post_id     BIGINT REFERENCES posts(id) ON DELETE CASCADE,
    comment_id  BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL CHECK (type IN ('LIKE', 'LOVE', 'HAHA', 'SAD', 'ANGRY', 'WOW')),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, comment_id, user_id)  -- 1 user chỉ reaction 1 lần/post hoặc comment
);

-- 5. friendships (follow + friend request)
CREATE TABLE friendships (
    id          BIGSERIAL PRIMARY KEY,
    user_id1    BIGINT REFERENCES users(id) ON DELETE CASCADE,
    user_id2    BIGINT REFERENCES users(id) ON DELETE CASCADE,
    status      VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED')),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id1, user_id2)
);

-- 6. chat_rooms (1-1 hoặc group)
CREATE TABLE chat_rooms (
    id          BIGSERIAL PRIMARY KEY,
    type        VARCHAR(10) DEFAULT 'PRIVATE' CHECK (type IN ('PRIVATE', 'GROUP')),
    name        VARCHAR(100),  -- tên group nếu có
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. chat_room_members (many-to-many)
CREATE TABLE chat_room_members (
    room_id     BIGINT REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    joined_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, user_id)
);

-- 8. chat_messages (lịch sử, realtime dùng Redis + WebSocket)
CREATE TABLE chat_messages (
    id          BIGSERIAL PRIMARY KEY,
    room_id     BIGINT REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id   BIGINT REFERENCES users(id) ON DELETE SET NULL,
    content     TEXT NOT NULL,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. moderation_logs (log AI check)
CREATE TABLE moderation_logs (
    id              BIGSERIAL PRIMARY KEY,
    post_id         BIGINT REFERENCES posts(id) ON DELETE SET NULL,
    comment_id      BIGINT REFERENCES comments(id) ON DELETE SET NULL,
    model_used      VARCHAR(50), 
    result          VARCHAR(20),  -- 'SAFE', 'UNSAFE', 'HATE', ...
    confidence      DECIMAL(5,4),
    reason          TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index quan trọng để tăng tốc query
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_reactions_post_id ON reactions(post_id);
CREATE INDEX idx_friendships_user_id1 ON friendships(user_id1);
CREATE INDEX idx_friendships_user_id2 ON friendships(user_id2);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_room_members_user_id ON chat_room_members(user_id);