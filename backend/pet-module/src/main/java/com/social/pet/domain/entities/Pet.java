package com.social.pet.domain.entities;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "pets")
public class Pet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_user_id", nullable = false)
    private Long ownerUserId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "species", nullable = false, length = 50)
    private PetSpecies species;

    @Column(name = "breed", length = 100)
    private String breed;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false, length = 20)
    private PetGender gender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "weight_kg", precision = 6, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "microchip_code", length = 64)
    private String microchipCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PetStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", nullable = false, length = 20)
    private PetVisibility visibility;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected Pet() {
    }

    public static Pet create(
            Long ownerUserId,
            String name,
            PetSpecies species,
            String breed,
            PetGender gender,
            LocalDate birthDate,
            BigDecimal weightKg,
            String avatarUrl,
            String bio,
            String microchipCode,
            PetVisibility visibility) {
        Pet pet = new Pet();
        pet.ownerUserId = ownerUserId;
        pet.name = normalizeName(name);
        pet.species = species == null ? PetSpecies.OTHER : species;
        pet.breed = normalizeOptionalText(breed, 100);
        pet.gender = gender == null ? PetGender.UNKNOWN : gender;
        pet.birthDate = birthDate;
        pet.weightKg = normalizeWeight(weightKg);
        pet.avatarUrl = normalizeOptionalText(avatarUrl, 2048);
        pet.bio = normalizeOptionalText(bio, 2000);
        pet.microchipCode = normalizeOptionalText(microchipCode, 64);
        pet.status = PetStatus.ACTIVE;
        pet.visibility = visibility == null ? PetVisibility.PUBLIC : visibility;
        return pet;
    }

    public void update(
            Long actorId,
            String name,
            PetSpecies species,
            String breed,
            PetGender gender,
            LocalDate birthDate,
            BigDecimal weightKg,
            String avatarUrl,
            String bio,
            String microchipCode,
            PetStatus status,
            PetVisibility visibility) {
        ensureOwner(actorId);
        this.name = normalizeName(name);
        if (species != null) {
            this.species = species;
        }
        this.breed = normalizeOptionalText(breed, 100);
        if (gender != null) {
            this.gender = gender;
        }
        this.birthDate = birthDate;
        this.weightKg = normalizeWeight(weightKg);
        this.avatarUrl = normalizeOptionalText(avatarUrl, 2048);
        this.bio = normalizeOptionalText(bio, 2000);
        this.microchipCode = normalizeOptionalText(microchipCode, 64);
        if (status != null) {
            this.status = status;
        }
        if (visibility != null) {
            this.visibility = visibility;
        }
    }

    public void delete(Long actorId) {
        ensureOwner(actorId);
    }

    public boolean isOwner(Long userId) {
        return ownerUserId.equals(userId);
    }

    public boolean isVisibleTo(Long actorId, boolean isFriend) {
        if (isOwner(actorId)) {
            return true;
        }
        if (visibility == PetVisibility.PUBLIC) {
            return true;
        }
        if (visibility == PetVisibility.FRIENDS && isFriend) {
            return true;
        }
        return false;
    }

    private void ensureOwner(Long actorId) {
        if (!ownerUserId.equals(actorId)) {
            throw new IllegalStateException("Bạn không có quyền thao tác hồ sơ thú cưng này");
        }
    }

    private static String normalizeName(String input) {
        String value = input == null ? "" : input.trim();
        if (value.isBlank()) {
            throw new IllegalArgumentException("Tên thú cưng không được để trống");
        }
        if (value.length() > 100) {
            throw new IllegalArgumentException("Tên thú cưng vượt quá 100 ký tự");
        }
        return value;
    }

    private static String normalizeOptionalText(String input, int maxLength) {
        if (input == null) {
            return null;
        }
        String value = input.trim();
        if (value.isBlank()) {
            return null;
        }
        if (value.length() > maxLength) {
            throw new IllegalArgumentException("Nội dung vượt quá " + maxLength + " ký tự");
        }
        return value;
    }

    private static BigDecimal normalizeWeight(BigDecimal weightKg) {
        if (weightKg == null) {
            return null;
        }
        if (weightKg.signum() <= 0) {
            throw new IllegalArgumentException("Cân nặng phải lớn hơn 0");
        }
        if (weightKg.compareTo(new BigDecimal("999.99")) > 0) {
            throw new IllegalArgumentException("Cân nặng không hợp lệ");
        }
        return weightKg;
    }

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getOwnerUserId() {
        return ownerUserId;
    }

    public String getName() {
        return name;
    }

    public PetSpecies getSpecies() {
        return species;
    }

    public String getBreed() {
        return breed;
    }

    public PetGender getGender() {
        return gender;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public BigDecimal getWeightKg() {
        return weightKg;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public String getBio() {
        return bio;
    }

    public String getMicrochipCode() {
        return microchipCode;
    }

    public PetStatus getStatus() {
        return status;
    }

    public PetVisibility getVisibility() {
        return visibility;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
