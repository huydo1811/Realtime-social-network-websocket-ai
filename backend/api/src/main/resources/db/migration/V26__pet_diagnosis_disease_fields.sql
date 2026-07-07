ALTER TABLE pet_diagnoses
    ADD COLUMN likely_disease TEXT NOT NULL DEFAULT 'Chưa đủ dữ liệu để kết luận',
    ADD COLUMN differential_diagnoses TEXT,
    ADD COLUMN red_flags TEXT;

UPDATE pet_diagnoses
SET likely_disease = COALESCE(NULLIF(summary, ''), 'Chưa đủ dữ liệu để kết luận')
WHERE likely_disease IS NULL;