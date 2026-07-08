package com.social.moderation.domain;

import java.time.Instant;

/**
 * Result of a moderation inference call against an external text model.
 *
 * @param violation      whether the model classified the text as violating the policy
 * @param score          raw probability in [0, 1] returned by the model
 * @param threshold      effective threshold used for the violation decision
 * @param modelName      model identifier (e.g. {@code phobert_v1})
 * @param reason         free-form tag such as {@code profanity} / {@code clean} / {@code fallback}
 * @param inferenceMs    wall-clock inference duration in milliseconds
 * @param source         {@code ai} for the primary model, {@code fallback} when the service was unreachable
 * @param createdAt      timestamp recorded by the Java side
 */
public record ModerationResult(
        boolean violation,
        double score,
        double threshold,
        String modelName,
        String reason,
        long inferenceMs,
        Source source,
        Instant createdAt
) {
    public enum Source { AI, FALLBACK }

    public static ModerationResult fallback(String reason, long inferenceMs) {
        return new ModerationResult(
                false,
                0.0,
                0.0,
                "fallback",
                reason,
                inferenceMs,
                Source.FALLBACK,
                Instant.now()
        );
    }
}