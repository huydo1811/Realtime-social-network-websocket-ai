package com.social.moderation.domain;

import java.time.Instant;

public record ImageModerationResult(
        boolean violation,
        double score,
        double threshold,
        String modelName,
        String reason,
        String predictedLabel,
        long inferenceMs,
        Source source,
        Instant createdAt
) {
    public enum Source {
        AI,
        FALLBACK
    }

    public static ImageModerationResult fallback(String reason, long inferenceMs) {
        return new ImageModerationResult(
                false,
                0.0,
                1.0,
                "image_filter_fallback",
                reason,
                "unknown",
                inferenceMs,
                Source.FALLBACK,
                Instant.now()
        );
    }
}

