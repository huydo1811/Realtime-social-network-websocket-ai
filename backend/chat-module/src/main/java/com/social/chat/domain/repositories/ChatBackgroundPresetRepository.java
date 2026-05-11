package com.social.chat.domain.repositories;

import java.util.List;
import java.util.Optional;

import com.social.chat.domain.entities.ChatBackgroundPreset;

public interface ChatBackgroundPresetRepository {
    ChatBackgroundPreset save(ChatBackgroundPreset preset);

    Optional<ChatBackgroundPreset> findById(Long id);

    List<ChatBackgroundPreset> findAll();

    List<ChatBackgroundPreset> findAllActive();
}
