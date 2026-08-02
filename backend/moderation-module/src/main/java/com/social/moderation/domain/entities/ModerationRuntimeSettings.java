package com.social.moderation.domain.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "moderation_runtime_settings")
public class ModerationRuntimeSettings {
    @Id
    private Short id = 1;

    @Column(name = "text_enabled", nullable = false)
    private boolean textEnabled = true;

    @Column(name = "image_enabled", nullable = false)
    private boolean imageEnabled = true;

    @Column(name = "text_allow_threshold", nullable = false)
    private double textAllowThreshold = 0.50;

    @Column(name = "text_reject_threshold", nullable = false)
    private double textRejectThreshold = 0.85;

    @Column(name = "image_threshold", nullable = false)
    private double imageThreshold = 0.60;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    protected ModerationRuntimeSettings() {
    }

    public static ModerationRuntimeSettings defaults() {
        return new ModerationRuntimeSettings();
    }

    public void apply(
            boolean textEnabled,
            boolean imageEnabled,
            double textAllowThreshold,
            double textRejectThreshold,
            double imageThreshold) {
        if (textRejectThreshold <= textAllowThreshold) {
            throw new IllegalArgumentException("Ngưỡng từ chối text phải lớn hơn ngưỡng chờ duyệt");
        }
        if (imageThreshold < 0 || imageThreshold > 1) {
            throw new IllegalArgumentException("Ngưỡng ảnh phải trong [0,1]");
        }
        this.textEnabled = textEnabled;
        this.imageEnabled = imageEnabled;
        this.textAllowThreshold = textAllowThreshold;
        this.textRejectThreshold = textRejectThreshold;
        this.imageThreshold = imageThreshold;
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Short getId() {
        return id;
    }

    public boolean isTextEnabled() {
        return textEnabled;
    }

    public boolean isImageEnabled() {
        return imageEnabled;
    }

    public double getTextAllowThreshold() {
        return textAllowThreshold;
    }

    public double getTextRejectThreshold() {
        return textRejectThreshold;
    }

    public double getImageThreshold() {
        return imageThreshold;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
