package com.social.friendship.domain.exceptions;

import com.social.moderation.domain.ModerationResult;

public class GroupPostTextModerationRejectedException extends RuntimeException {
    private final double score;
    private final String modelName;

    public GroupPostTextModerationRejectedException(ModerationResult result) {
        super("Noi dung bai viet nhom chua tu ngu khong phu hop");
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

