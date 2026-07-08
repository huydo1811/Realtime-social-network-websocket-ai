package com.social.moderation.domain;

/**
 * Pluggable text-moderation contract used by feature modules (post, comment, ...).
 *
 * <p>Implementations should be safe to call from any thread and should never
 * throw on upstream failures — wrap and degrade to {@code ALLOW} via the
 * {@link ModerationResult#fallback(String, long)} factory.</p>
 */
public interface TextModerationService {

    /**
     * Inspect the provided text and return a structured result.
     */
    ModerationResult moderate(String text);
}