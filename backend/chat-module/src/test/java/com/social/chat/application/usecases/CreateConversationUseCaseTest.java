package com.social.chat.application.usecases;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

import java.util.Set;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.social.chat.domain.entities.ConversationType;
import com.social.chat.domain.exceptions.InvalidConversationException;
import com.social.chat.domain.repositories.ChatConversationRepository;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

class CreateConversationUseCaseTest {

    @Test
    void shouldRejectPrivateConversationWhenMoreThanOneParticipant() {
        ChatConversationRepository conversationRepository = Mockito.mock(ChatConversationRepository.class);
        UserRepository userRepository = Mockito.mock(UserRepository.class);
        CreateConversationUseCase useCase = new CreateConversationUseCase(conversationRepository, userRepository);

        assertThrows(InvalidConversationException.class,
            () -> useCase.execute(1L, ConversationType.PRIVATE, null, Set.of(2L, 3L)));
    }

    @Test
    void shouldRejectWhenParticipantNotExists() {
        ChatConversationRepository conversationRepository = Mockito.mock(ChatConversationRepository.class);
        UserRepository userRepository = Mockito.mock(UserRepository.class);
        when(userRepository.findById(anyLong())).thenReturn(java.util.Optional.empty());

        CreateConversationUseCase useCase = new CreateConversationUseCase(conversationRepository, userRepository);

        assertThrows(InvalidConversationException.class,
            () -> useCase.execute(1L, ConversationType.PRIVATE, null, Set.of(2L)));
    }
}
