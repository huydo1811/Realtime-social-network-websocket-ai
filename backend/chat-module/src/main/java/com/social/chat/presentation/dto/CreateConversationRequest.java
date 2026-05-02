package com.social.chat.presentation.dto;

import java.util.HashSet;
import java.util.Set;

import com.social.chat.domain.entities.ConversationType;

import jakarta.validation.constraints.NotNull;

public class CreateConversationRequest {

    @NotNull(message = "Type conversation là bắt buộc")
    private ConversationType type;

    private String name;

    private Set<Long> participantIds = new HashSet<>();

    private String idempotencyKey;

    public ConversationType getType() {
        return type;
    }

    public void setType(ConversationType type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Set<Long> getParticipantIds() {
        return participantIds;
    }

    public void setParticipantIds(Set<Long> participantIds) {
        this.participantIds = participantIds;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }
}
