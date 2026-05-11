CREATE TABLE call_sessions (
    id BIGSERIAL PRIMARY KEY,
    call_id VARCHAR(120) NOT NULL UNIQUE,
    caller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    callee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_type VARCHAR(16) NOT NULL CHECK (media_type IN ('voice', 'video')),
    status VARCHAR(32) NOT NULL,
    started_at TIMESTAMP,
    answered_at TIMESTAMP,
    ended_at TIMESTAMP,
    end_reason VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE call_events (
    id BIGSERIAL PRIMARY KEY,
    call_id VARCHAR(120) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    payload TEXT,
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_call_sessions_caller_created ON call_sessions(caller_id, created_at DESC);
CREATE INDEX idx_call_sessions_callee_created ON call_sessions(callee_id, created_at DESC);
CREATE INDEX idx_call_events_call_occurred ON call_events(call_id, occurred_at DESC);
