CREATE TABLE pet_walk_sessions (
    id                  BIGSERIAL PRIMARY KEY,
    pet_id              BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    created_by_user_id  BIGINT NOT NULL REFERENCES users(id),
    visibility          VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    start_latitude      DOUBLE PRECISION NOT NULL,
    start_longitude     DOUBLE PRECISION NOT NULL,
    current_latitude    DOUBLE PRECISION NOT NULL,
    current_longitude   DOUBLE PRECISION NOT NULL,
    route_name          VARCHAR(120),
    note                TEXT,
    started_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at            TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pet_walk_sessions_visibility_check CHECK (visibility IN ('PUBLIC', 'FRIENDS', 'PRIVATE')),
    CONSTRAINT pet_walk_sessions_status_check CHECK (status IN ('PLANNED', 'ACTIVE', 'FINISHED', 'CANCELLED'))
);

CREATE INDEX idx_pet_walk_sessions_pet_id ON pet_walk_sessions(pet_id);
CREATE INDEX idx_pet_walk_sessions_status_visibility ON pet_walk_sessions(status, visibility);
CREATE INDEX idx_pet_walk_sessions_started_at ON pet_walk_sessions(started_at DESC);

CREATE TABLE pet_walk_meetup_requests (
    id                  BIGSERIAL PRIMARY KEY,
    walk_session_id     BIGINT NOT NULL REFERENCES pet_walk_sessions(id) ON DELETE CASCADE,
    requester_user_id   BIGINT NOT NULL REFERENCES users(id),
    message             TEXT,
    meetup_latitude     DOUBLE PRECISION,
    meetup_longitude    DOUBLE PRECISION,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    responded_by_user_id BIGINT REFERENCES users(id),
    responded_at        TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pet_walk_meetup_requests_status_check CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'))
);

CREATE INDEX idx_pet_walk_meetup_requests_walk_session_id ON pet_walk_meetup_requests(walk_session_id);
CREATE INDEX idx_pet_walk_meetup_requests_requester_user_id ON pet_walk_meetup_requests(requester_user_id);
CREATE INDEX idx_pet_walk_meetup_requests_status ON pet_walk_meetup_requests(status);

CREATE TABLE pet_symptom_reports (
    id                  BIGSERIAL PRIMARY KEY,
    pet_id              BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    created_by_user_id  BIGINT NOT NULL REFERENCES users(id),
    symptoms_text       TEXT NOT NULL,
    temperature_c       DOUBLE PRECISION,
    duration_hours      INTEGER,
    appetite_loss       BOOLEAN,
    energy_drop         BOOLEAN,
    vomiting            BOOLEAN,
    diarrhea            BOOLEAN,
    cough               BOOLEAN,
    breathing_difficulty BOOLEAN,
    skin_rash           BOOLEAN,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pet_symptom_reports_pet_id ON pet_symptom_reports(pet_id);
CREATE INDEX idx_pet_symptom_reports_created_at ON pet_symptom_reports(created_at DESC);

CREATE TABLE pet_diagnoses (
    id                  BIGSERIAL PRIMARY KEY,
    pet_id              BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    report_id           BIGINT NOT NULL REFERENCES pet_symptom_reports(id) ON DELETE CASCADE,
    severity            VARCHAR(20) NOT NULL,
    summary             TEXT NOT NULL,
    possible_causes     TEXT,
    recommendation      TEXT NOT NULL,
    should_see_vet      BOOLEAN NOT NULL DEFAULT false,
    confidence_score    INTEGER NOT NULL DEFAULT 60,
    model_name          VARCHAR(80) NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pet_diagnoses_severity_check CHECK (severity IN ('LOW', 'MODERATE', 'HIGH', 'EMERGENCY')),
    CONSTRAINT pet_diagnoses_confidence_check CHECK (confidence_score >= 0 AND confidence_score <= 100)
);

CREATE INDEX idx_pet_diagnoses_pet_id ON pet_diagnoses(pet_id);
CREATE INDEX idx_pet_diagnoses_report_id ON pet_diagnoses(report_id);
CREATE INDEX idx_pet_diagnoses_created_at ON pet_diagnoses(created_at DESC);