package com.social.moderation.application.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.moderation.domain.ModerationPolicy;
import com.social.moderation.domain.entities.ModerationModelVersion;
import com.social.moderation.domain.entities.ModerationModelVersion.ModelType;
import com.social.moderation.domain.entities.ModerationRuntimeSettings;
import com.social.moderation.domain.repositories.ModerationModelVersionRepository;
import com.social.moderation.domain.repositories.ModerationRuntimeSettingsRepository;
import com.social.moderation.infrastructure.config.ModerationProperties;

@Service
public class ModerationRuntimeConfigService {
    private final ModerationRuntimeSettingsRepository settingsRepository;
    private final ModerationModelVersionRepository modelVersionRepository;
    private final ModerationProperties properties;

    public ModerationRuntimeConfigService(
            ModerationRuntimeSettingsRepository settingsRepository,
            ModerationModelVersionRepository modelVersionRepository,
            ModerationProperties properties) {
        this.settingsRepository = settingsRepository;
        this.modelVersionRepository = modelVersionRepository;
        this.properties = properties;
    }

    @Transactional(readOnly = true)
    public ModerationRuntimeSettings currentSettings() {
        return settingsRepository.findById((short) 1).orElseGet(this::fallbackSettings);
    }

    public boolean isTextEnabled() {
        return currentSettings().isTextEnabled() && properties.isEnabled();
    }

    public boolean isImageEnabled() {
        return currentSettings().isImageEnabled() && properties.isEnabled();
    }

    public ModerationPolicy textPolicy() {
        ModerationRuntimeSettings settings = currentSettings();
        return ModerationPolicy.of(settings.getTextAllowThreshold(), settings.getTextRejectThreshold());
    }

    public double imageThreshold() {
        return currentSettings().getImageThreshold();
    }

    public String activeTextModelVersion() {
        return modelVersionRepository.findByModelTypeAndActiveTrue(ModelType.TEXT)
                .map(ModerationModelVersion::getVersion)
                .orElse(properties.getDefaultModelName());
    }

    public String activeImageModelVersion() {
        return modelVersionRepository.findByModelTypeAndActiveTrue(ModelType.IMAGE)
                .map(ModerationModelVersion::getVersion)
                .orElse("img-v1");
    }

    @Transactional
    public ModerationRuntimeSettings updateSettings(
            boolean textEnabled,
            boolean imageEnabled,
            double textAllowThreshold,
            double textRejectThreshold,
            double imageThreshold) {
        ModerationRuntimeSettings settings = settingsRepository.findById((short) 1)
                .orElseGet(() -> settingsRepository.save(ModerationRuntimeSettings.defaults()));
        settings.apply(textEnabled, imageEnabled, textAllowThreshold, textRejectThreshold, imageThreshold);
        return settingsRepository.save(settings);
    }

    @Transactional
    public ModerationModelVersion activateModel(Long modelId) {
        ModerationModelVersion target = modelVersionRepository.findById(modelId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiên bản mô hình"));
        ModelType type = target.getModelType();
        modelVersionRepository.deactivateAllOfType(type);
        ModerationModelVersion fresh = modelVersionRepository.findById(modelId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiên bản mô hình"));
        fresh.activate();
        ModerationModelVersion saved = modelVersionRepository.saveAndFlush(fresh);

        ModerationRuntimeSettings settings = currentSettings();
        if (saved.getModelType() == ModelType.TEXT) {
            settings.apply(
                    settings.isTextEnabled(),
                    settings.isImageEnabled(),
                    saved.getThresholdAllow(),
                    saved.getThresholdReject(),
                    settings.getImageThreshold()
            );
        } else {
            settings.apply(
                    settings.isTextEnabled(),
                    settings.isImageEnabled(),
                    settings.getTextAllowThreshold(),
                    settings.getTextRejectThreshold(),
                    saved.getThresholdAllow()
            );
        }
        settingsRepository.save(settings);
        return saved;
    }

    private ModerationRuntimeSettings fallbackSettings() {
        ModerationRuntimeSettings settings = ModerationRuntimeSettings.defaults();
        settings.apply(
                properties.isEnabled(),
                properties.isEnabled(),
                properties.getAllowThreshold(),
                properties.getRejectThreshold(),
                0.60
        );
        return settings;
    }
}
