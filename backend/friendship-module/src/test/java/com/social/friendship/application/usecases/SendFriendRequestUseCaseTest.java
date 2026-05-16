package com.social.friendship.application.usecases;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;

import com.social.friendship.application.services.FriendshipEventFactory;
import com.social.friendship.domain.entities.Friendship;
import com.social.friendship.domain.entities.FriendshipStatus;
import com.social.friendship.domain.events.FriendshipRealtimeEvent;
import com.social.friendship.domain.repositories.FriendshipRepository;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

@ExtendWith(MockitoExtension.class)
class SendFriendRequestUseCaseTest {

    @Mock
    private FriendshipRepository friendshipRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private FriendshipEventFactory eventFactory;
    @Mock
    private ApplicationEventPublisher springEventPublisher;

    private SendFriendRequestUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new SendFriendRequestUseCase(
                friendshipRepository, userRepository, eventFactory, springEventPublisher);
        when(userRepository.findById(1L)).thenReturn(Optional.of(new User()));
        when(userRepository.findById(2L)).thenReturn(Optional.of(new User()));
    }

    private void stubPublish() {
        when(eventFactory.create(any(), any(), any(), any())).thenReturn(new FriendshipRealtimeEvent());
    }

    @Test
    void shouldReopenRejectedRowInsteadOfInsertingNewOne() {
        stubPublish();
        Friendship rejected = Friendship.createPending(1L, 2L);
        rejected.reject(2L);
        setFriendshipId(rejected, 99L);

        when(friendshipRepository.findByUsers(1L, 2L)).thenReturn(Optional.of(rejected));
        when(friendshipRepository.save(rejected)).thenAnswer(inv -> inv.getArgument(0));

        Friendship saved = useCase.execute(1L, 2L);

        assertEquals(FriendshipStatus.PENDING, saved.getStatus());
        assertEquals(99L, saved.getId());
        assertEquals(1L, saved.getRequestedBy());
        verify(friendshipRepository).save(rejected);
    }

    @Test
    void shouldRetryLoadWhenInsertHitsUniqueConstraint() {
        stubPublish();
        Friendship rejected = Friendship.createPending(1L, 2L);
        rejected.reject(2L);
        setFriendshipId(rejected, 42L);

        when(friendshipRepository.findByUsers(1L, 2L))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(rejected));
        when(friendshipRepository.save(any(Friendship.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate"))
                .thenAnswer(inv -> inv.getArgument(0));

        Friendship saved = useCase.execute(1L, 2L);

        assertEquals(FriendshipStatus.PENDING, saved.getStatus());
        assertEquals(42L, saved.getId());
    }

    @Test
    void shouldRejectWhenAlreadyPending() {
        Friendship pending = Friendship.createPending(1L, 2L);
        setFriendshipId(pending, 7L);

        when(friendshipRepository.findByUsers(1L, 2L)).thenReturn(Optional.of(pending));

        assertThrows(IllegalStateException.class, () -> useCase.execute(1L, 2L));
        verify(friendshipRepository, never()).save(any());
    }

    private static void setFriendshipId(Friendship friendship, long id) {
        try {
            var field = Friendship.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(friendship, id);
        } catch (ReflectiveOperationException ex) {
            throw new RuntimeException(ex);
        }
    }
}
