package com.social.post.domain.exceptions;

import com.social.moderation.domain.ImageModerationResult;

public class PostImageModerationRejectedException extends RuntimeException {
    private final double score;
    private final String modelName;
    private final String predictedLabel;

    public PostImageModerationRejectedException(ImageModerationResult result) {
        super(result.source() == ImageModerationResult.Source.FALLBACK
                ? "Không kiểm tra được ảnh thú cưng lúc này. Vui lòng thử lại."
                : "Ảnh không phù hợp. Vui lòng đăng ảnh thú cưng.");
        this.score = result.score();
        this.modelName = result.modelName();
        this.predictedLabel = result.predictedLabel();
    }

    public double getScore() {
        return score;
    }

    public String getModelName() {
        return modelName;
    }

    public String getPredictedLabel() {
        return predictedLabel;
    }
}

