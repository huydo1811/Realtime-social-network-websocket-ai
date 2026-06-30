-- Core pet profiles and breed lookup
CREATE TABLE pets (
    id              BIGSERIAL PRIMARY KEY,
    owner_user_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    species         VARCHAR(50) NOT NULL,
    breed           VARCHAR(100),
    gender          VARCHAR(20) DEFAULT 'UNKNOWN',
    birth_date      DATE,
    weight_kg       DECIMAL(6, 2),
    avatar_url      TEXT,
    bio             TEXT,
    microchip_code  VARCHAR(64),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    visibility      VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pets_status_check CHECK (status IN ('ACTIVE', 'DECEASED', 'ADOPTED_OUT')),
    CONSTRAINT pets_visibility_check CHECK (visibility IN ('PUBLIC', 'FRIENDS', 'PRIVATE')),
    CONSTRAINT pets_gender_check CHECK (gender IN ('MALE', 'FEMALE', 'UNKNOWN'))
);

CREATE INDEX idx_pets_owner_user_id ON pets(owner_user_id);
CREATE INDEX idx_pets_species ON pets(species);
CREATE INDEX idx_pets_visibility ON pets(visibility);

CREATE TABLE pet_breeds (
    id      BIGSERIAL PRIMARY KEY,
    species VARCHAR(50) NOT NULL,
    name    VARCHAR(100) NOT NULL,
    UNIQUE (species, name)
);

CREATE INDEX idx_pet_breeds_species ON pet_breeds(species);

-- Common dog breeds in Vietnam
INSERT INTO pet_breeds (species, name) VALUES
    ('DOG', 'Chó ta (Mixed)'),
    ('DOG', 'Corgi'),
    ('DOG', 'Poodle'),
    ('DOG', 'Husky'),
    ('DOG', 'Golden Retriever'),
    ('DOG', 'Shiba Inu'),
    ('DOG', 'Pug'),
    ('DOG', 'Chihuahua'),
    ('DOG', 'Bulldog'),
    ('DOG', 'Beagle'),
    ('DOG', 'Dachshund'),
    ('DOG', 'Samoyed'),
    ('DOG', 'Alaska'),
    ('DOG', 'Pitbull'),
    ('DOG', 'Doberman');

-- Common cat breeds
INSERT INTO pet_breeds (species, name) VALUES
    ('CAT', 'Mèo ta (Mixed)'),
    ('CAT', 'Mèo Ba Tư'),
    ('CAT', 'Mèo Anh lông ngắn'),
    ('CAT', 'Mèo Anh lông dài'),
    ('CAT', 'Mèo Scottish Fold'),
    ('CAT', 'Mèo Bengal'),
    ('CAT', 'Mèo Siamese'),
    ('CAT', 'Mèo Ragdoll'),
    ('CAT', 'Mèo Munchkin'),
    ('CAT', 'Mèo Maine Coon');

-- Other species
INSERT INTO pet_breeds (species, name) VALUES
    ('BIRD', 'Chim sáo'),
    ('BIRD', 'Chim cảnh'),
    ('BIRD', 'Vẹt'),
    ('RABBIT', 'Thỏ mini'),
    ('RABBIT', 'Thỏ Angora'),
    ('HAMSTER', 'Hamster Bear'),
    ('HAMSTER', 'Hamster Roborovski'),
    ('FISH', 'Cá betta'),
    ('FISH', 'Cá vàng'),
    ('REPTILE', 'Rùa cạn'),
    ('REPTILE', 'Tắc kè'),
    ('OTHER', 'Khác');
