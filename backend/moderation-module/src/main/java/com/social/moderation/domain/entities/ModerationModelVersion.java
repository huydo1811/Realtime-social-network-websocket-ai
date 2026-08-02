package com.social.moderation.domain.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "moderation_model_versions")
public class ModerationModelVersion {
    public enum ModelType {
        TEXT,
        IMAGE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String version;

    @Column(name = "model_name", nullable = false, length = 80)
    private String modelName;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(nullable = false, length = 64)
    private String sha256;

    @Column(name = "threshold_allow", nullable = false)
    private double thresholdAllow;

    @Column(name = "threshold_reject", nullable = false)
    private double thresholdReject;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Enumerated(EnumType.STRING)
    @Column(name = "model_type", nullable = false, length = 16)
    private ModelType modelType = ModelType.TEXT;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    protected ModerationModelVersion() {
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public void activate() {
        this.active = true;
        this.activatedAt = LocalDateTime.now();
    }

    public void deactivate() {
        this.active = false;
    }

    public Long getId() {
        return id;
    }

    public String getVersion() {
        return version;
    }

    public String getModelName() {
        return modelName;
    }

    public String getFilePath() {
        return filePath;
    }

    public String getSha256() {
        return sha256;
    }

    public double getThresholdAllow() {
        return thresholdAllow;
    }

    public double getThresholdReject() {
        return thresholdReject;
    }

    public boolean isActive() {
        return active;
    }

    public ModelType getModelType() {
        return modelType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getActivatedAt() {
        return activatedAt;
    }
}
