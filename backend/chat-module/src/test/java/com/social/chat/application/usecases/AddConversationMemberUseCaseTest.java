package com.social.chat.application.usecases;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;

import com.social.chat.application.services.ChatPermissionService;
import com.social.chat.domain.entities.ChatConversation;
import com.social.chat.domain.exceptions.InvalidConversationException;
import com.social.chat.domain.repositories.ChatConversationRepository;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

class AddConversationMemberUseCaseTest {

    @Test
    void shouldRejectAddingMemberToPrivateConversation() {
        ChatConversationRepository conversationRepository = mock(ChatConversationRepository.class);
        ChatPermissionService permissionService = mock(ChatPermissionService.class);
        UserRepository userRepository = mock(UserRepository.class);

        AddConversationMemberUseCase useCase = new AddConversationMemberUseCase(
                conversationRepository, permissionService, userRepository);

        ChatConversation privateConversation = ChatConversation.privateConversation(1L, 2L);
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(privateConversation));

        assertThrows(InvalidConversationException.class,
                () -> useCase.execute(1L, 10L, 3L));
    }
}
