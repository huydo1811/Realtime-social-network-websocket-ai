package com.social.post.domain.exceptions;

import com.social.moderation.domain.ModerationResult;

/**
 * Thrown when the moderation pipeline produces a {@code HARD_REJECT}.
 * Mapped to HTTP 400 by the post exception handler.
 */
public class PostModerationRejectedException extends RuntimeException {

    private final double score;
    private final String modelName;

    public PostModerationRejectedException(ModerationResult result) {
        super("Nội dung chứa từ ngữ không phù hợp");
        this.score = result.score();
        this.modelName = result.modelName();
    }

    public double getScore() {
        return score;
    }

    public String getModelName() {
        return modelName;
    }
}