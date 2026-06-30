ALTER TABLE posts
    ADD COLUMN pet_id BIGINT REFERENCES pets(id) ON DELETE SET NULL;

CREATE INDEX idx_posts_pet_id ON posts(pet_id);
