CREATE TABLE pet_weight_entries (
    id              BIGSERIAL PRIMARY KEY,
    pet_id          BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    weight_kg       DECIMAL(6,2) NOT NULL,
    recorded_at      DATE NOT NULL,
    note            TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pet_weight_entries_positive CHECK (weight_kg > 0)
);

CREATE INDEX idx_pet_weight_entries_pet_id ON pet_weight_entries(pet_id);
CREATE INDEX idx_pet_weight_entries_recorded_at ON pet_weight_entries(recorded_at DESC);

CREATE TABLE pet_appetite_entries (
    id              BIGSERIAL PRIMARY KEY,
    pet_id          BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    level           VARCHAR(20) NOT NULL,
    recorded_at      DATE NOT NULL,
    note            TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pet_appetite_entries_level_check CHECK (
        level IN ('GOOD', 'NORMAL', 'POOR', 'NONE')
    )
);

CREATE INDEX idx_pet_appetite_entries_pet_id ON pet_appetite_entries(pet_id);
CREATE INDEX idx_pet_appetite_entries_recorded_at ON pet_appetite_entries(recorded_at DESC);

CREATE TABLE pet_activity_entries (
    id              BIGSERIAL PRIMARY KEY,
    pet_id          BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    minutes         INT NOT NULL,
    activity_type   VARCHAR(100) NOT NULL,
    recorded_at      DATE NOT NULL,
    note            TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pet_activity_entries_positive CHECK (minutes > 0)
);

CREATE INDEX idx_pet_activity_entries_pet_id ON pet_activity_entries(pet_id);
CREATE INDEX idx_pet_activity_entries_recorded_at ON pet_activity_entries(recorded_at DESC);
