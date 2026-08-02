package com.social.moderation.domain.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.moderation.domain.entities.ModerationRuntimeSettings;

public interface ModerationRuntimeSettingsRepository extends JpaRepository<ModerationRuntimeSettings, Short> {
}
