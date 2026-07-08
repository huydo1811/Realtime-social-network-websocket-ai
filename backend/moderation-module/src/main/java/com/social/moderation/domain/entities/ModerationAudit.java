package com.social.moderation.domain.entities;

import java.time.Instant;

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
@Table(name = "moderation_audit")
public class ModerationAudit {

    public enum TargetType { POST, COMMENT }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private TargetType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(name = "author_user_id", nullable = false)
    private Long authorUserId;

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    @Column(name = "content_preview", length = 500)
    private String contentPreview;

    @Column(name = "model_name", nullable = false, length = 80)
    private String modelName;

    @Column(name = "model_version", nullable = false, length = 40)
    private String modelVersion;

    @Column(name = "score", nullable = false, precision = 5)
    private double score;

    @Column(name = "threshold_allow", precision = 5)
    private Double thresholdAllow;

    @Column(name = "threshold_reject", precision = 5)
    private Double thresholdReject;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 20)
    private Source source;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 20)
    private Action action;

    @Column(name = "inference_ms", nullable = false)
    private long inferenceMs;

    @Column(name = "handled", nullable = false)
    private boolean handled;

    @Column(name = "handled_at")
    private Instant handledAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public enum Source { AI, FALLBACK }
    public enum Action { ALLOW, SOFT_HIDE, HARD_REJECT, FALLBACK }

    protected ModerationAudit() { }

    public static ModerationAudit of(
            TargetType targetType,
            Long targetId,
            Long authorUserId,
            String contentHash,
            String contentPreview,
            String modelName,
            String modelVersion,
            double score,
            Double thresholdAllow,
            Double thresholdReject,
            Source source,
            Action action,
            long inferenceMs) {
        ModerationAudit audit = new ModerationAudit();
        audit.targetType = targetType;
        audit.targetId = targetId;
        audit.authorUserId = authorUserId;
        audit.contentHash = contentHash;
        audit.contentPreview = contentPreview;
        audit.modelName = modelName;
        audit.modelVersion = modelVersion;
        audit.score = score;
        audit.thresholdAllow = thresholdAllow;
        audit.thresholdReject = thresholdReject;
        audit.source = source;
        audit.action = action;
        audit.inferenceMs = inferenceMs;
        audit.handled = false;
        audit.handledAt = null;
        return audit;
    }

    public void markHandled() {
        this.handled = true;
        if (this.handledAt == null) {
            this.handledAt = Instant.now();
        }
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public TargetType getTargetType() { return targetType; }
    public Long getTargetId() { return targetId; }
    public Long getAuthorUserId() { return authorUserId; }
    public String getContentHash() { return contentHash; }
    public String getContentPreview() { return contentPreview; }
    public String getModelName() { return modelName; }
    public String getModelVersion() { return modelVersion; }
    public double getScore() { return score; }
    public Double getThresholdAllow() { return thresholdAllow; }
    public Double getThresholdReject() { return thresholdReject; }
    public Source getSource() { return source; }
    public Action getAction() { return action; }
    public long getInferenceMs() { return inferenceMs; }
    public boolean isHandled() { return handled; }
    public Instant getHandledAt() { return handledAt; }
    public Instant getCreatedAt() { return createdAt; }
}