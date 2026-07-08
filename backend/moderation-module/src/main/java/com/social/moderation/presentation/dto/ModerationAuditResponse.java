package com.social.moderation.presentation.dto;

import java.time.Instant;

import com.social.moderation.domain.entities.ModerationAudit;

public record ModerationAuditResponse(
        Long id,
        String targetType,
        Long targetId,
        Long authorUserId,
        String contentHash,
        String contentPreview,
        String modelName,
        String modelVersion,
        double score,
        Double thresholdAllow,
        Double thresholdReject,
        String source,
        String action,
        long inferenceMs,
        boolean handled,
        Instant handledAt,
        Instant createdAt
) {
    public static ModerationAuditResponse from(ModerationAudit a) {
        return new ModerationAuditResponse(
                a.getId(),
                a.getTargetType().name(),
                a.getTargetId(),
                a.getAuthorUserId(),
                a.getContentHash(),
                a.getContentPreview(),
                a.getModelName(),
                a.getModelVersion(),
                a.getScore(),
                a.getThresholdAllow(),
                a.getThresholdReject(),
                a.getSource().name(),
                a.getAction().name(),
                a.getInferenceMs(),
                a.isHandled(),
                a.getHandledAt(),
                a.getCreatedAt()
        );
    }
}