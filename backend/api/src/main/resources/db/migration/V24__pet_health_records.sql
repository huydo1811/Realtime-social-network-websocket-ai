CREATE TABLE pet_health_records (
    id                  BIGSERIAL PRIMARY KEY,
    pet_id              BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    record_type         VARCHAR(30) NOT NULL,
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    performed_at        DATE NOT NULL,
    clinic_name         VARCHAR(200),
    document_url        TEXT,
    created_by_user_id  BIGINT NOT NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pet_health_records_type_check CHECK (
        record_type IN ('VACCINE', 'DEWORM', 'CHECKUP', 'SURGERY', 'MEDICATION', 'OTHER')
    )
);

CREATE INDEX idx_pet_health_records_pet_id ON pet_health_records(pet_id);
CREATE INDEX idx_pet_health_records_performed_at ON pet_health_records(performed_at DESC);

CREATE TABLE pet_health_reminders (
    id                  BIGSERIAL PRIMARY KEY,
    pet_id              BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    health_record_id    BIGINT REFERENCES pet_health_records(id) ON DELETE SET NULL,
    title               VARCHAR(200) NOT NULL,
    reminder_type       VARCHAR(30) NOT NULL,
    due_date            DATE NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    note                TEXT,
    created_by_user_id  BIGINT NOT NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pet_health_reminders_type_check CHECK (
        reminder_type IN ('VACCINE', 'DEWORM', 'CHECKUP', 'SURGERY', 'MEDICATION', 'OTHER')
    ),
    CONSTRAINT pet_health_reminders_status_check CHECK (
        status IN ('PENDING', 'COMPLETED', 'DISMISSED')
    )
);

CREATE INDEX idx_pet_health_reminders_pet_id ON pet_health_reminders(pet_id);
CREATE INDEX idx_pet_health_reminders_due_date ON pet_health_reminders(due_date);
CREATE INDEX idx_pet_health_reminders_status ON pet_health_reminders(status);
