package com.social.moderation.presentation.dto;

import java.time.LocalDateTime;

import com.social.moderation.domain.entities.ModerationModelVersion;
import com.social.moderation.domain.entities.ModerationRuntimeSettings;

public final class ModerationAdminDtos {
    private ModerationAdminDtos() {
    }

    public record SettingsResponse(
            boolean textEnabled,
            boolean imageEnabled,
            double textAllowThreshold,
            double textRejectThreshold,
            double imageThreshold,
            LocalDateTime updatedAt
    ) {
        public static SettingsResponse from(ModerationRuntimeSettings row) {
            return new SettingsResponse(
                    row.isTextEnabled(),
                    row.isImageEnabled(),
                    row.getTextAllowThreshold(),
                    row.getTextRejectThreshold(),
                    row.getImageThreshold(),
                    row.getUpdatedAt()
            );
        }
    }

    public record UpdateSettingsRequest(
            Boolean textEnabled,
            Boolean imageEnabled,
            Double textAllowThreshold,
            Double textRejectThreshold,
            Double imageThreshold
    ) {
    }

    public record ModelVersionResponse(
            Long id,
            String version,
            String modelName,
            String modelType,
            String filePath,
            double thresholdAllow,
            double thresholdReject,
            boolean active,
            LocalDateTime createdAt,
            LocalDateTime activatedAt
    ) {
        public static ModelVersionResponse from(ModerationModelVersion row) {
            return new ModelVersionResponse(
                    row.getId(),
                    row.getVersion(),
                    row.getModelName(),
                    row.getModelType().name(),
                    row.getFilePath(),
                    row.getThresholdAllow(),
                    row.getThresholdReject(),
                    row.isActive(),
                    row.getCreatedAt(),
                    row.getActivatedAt()
            );
        }
    }

    public record AiStatusResponse(
            SettingsResponse settings,
            ModelVersionResponse activeTextModel,
            ModelVersionResponse activeImageModel,
            AiServiceHealth aiService
    ) {
    }

    public record AiServiceHealth(
            boolean reachable,
            String status,
            boolean textModelLoaded,
            boolean imageModelLoaded,
            String textModel,
            String imageModel,
            Double imageThreshold,
            String detail
    ) {
    }
}
