package com.social.chat.domain.entities;

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
@Table(name = "chat_background_presets")
public class ChatBackgroundPreset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Column(name = "created_by")
    private Long createdBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "origin", nullable = false, length = 20)
    private ChatBackgroundPresetOrigin origin = ChatBackgroundPresetOrigin.ADMIN;

    @Column(name = "is_active", nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static ChatBackgroundPreset create(String name, String imageUrl, Long createdBy) {
        ChatBackgroundPreset preset = new ChatBackgroundPreset();
        preset.name = name == null || name.isBlank() ? "Background" : name.trim();
        preset.imageUrl = imageUrl == null ? "" : imageUrl.trim();
        preset.createdBy = createdBy;
        preset.origin = ChatBackgroundPresetOrigin.ADMIN;
        preset.active = true;
        return preset;
    }

    public void deactivate() {
        this.active = false;
    }

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public ChatBackgroundPresetOrigin getOrigin() {
        return origin;
    }

    public Boolean getActive() {
        return active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
