package com.social.chat.infrastructure.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.social.chat.domain.entities.ChatBackgroundPreset;
import com.social.chat.domain.repositories.ChatBackgroundPresetRepository;

@Repository
public class ChatBackgroundPresetRepositoryImpl implements ChatBackgroundPresetRepository {
    private final JpaChatBackgroundPresetRepository jpaRepository;

    public ChatBackgroundPresetRepositoryImpl(JpaChatBackgroundPresetRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public ChatBackgroundPreset save(ChatBackgroundPreset preset) {
        return jpaRepository.save(preset);
    }

    @Override
    public Optional<ChatBackgroundPreset> findById(Long id) {
        return jpaRepository.findById(id);
    }

    @Override
    public List<ChatBackgroundPreset> findAll() {
        return jpaRepository.findAll();
    }

    @Override
    public List<ChatBackgroundPreset> findAllActive() {
        return jpaRepository.findByActiveTrueOrderByCreatedAtDesc();
    }
}
