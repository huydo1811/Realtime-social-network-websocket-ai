package com.social.chat.application.usecases;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.social.chat.domain.entities.ChatUserPresence;
import com.social.chat.domain.repositories.ChatUserPresenceRepository;

@Service
public class GetUserPresenceUseCase {

    private final ChatUserPresenceRepository presenceRepository;

    public GetUserPresenceUseCase(ChatUserPresenceRepository presenceRepository) {
        this.presenceRepository = presenceRepository;
    }

    public List<ChatUserPresence> execute(Set<Long> userIds) {
        return presenceRepository.findAllByUserIds(userIds);
    }
}
