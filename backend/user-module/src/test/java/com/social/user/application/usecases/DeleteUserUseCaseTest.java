package com.social.user.application.usecases;

import java.sql.Timestamp;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

@ExtendWith(MockitoExtension.class)
class DeleteUserUseCaseTest {
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DeleteUserUseCase sut;

    @Test
    void whenNotFound_thenThrow() {
        when(userRepository.findById(5L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> sut.execute(5L));
    }

    @Test
    void whenFound_thenSoftDeleteAndSave() {
        User u = new User(1L, "e@mail", "01", "h", "N", "", "", "", "USER", true, new Timestamp(0), new Timestamp(0));
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        sut.execute(1L);

        ArgumentCaptor<User> cap = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(cap.capture());
        assertFalse(Boolean.TRUE.equals(cap.getValue().getIsActive()));
    }

    @Test
    void whenFound_updatesUpdatedAt() {
        Timestamp before = new Timestamp(0);
        User u = new User(1L, "e@mail", "01", "h", "N", "", "", "", "USER", true, before, before);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        sut.execute(1L);

        ArgumentCaptor<User> cap = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(cap.capture());
        assertTrue(cap.getValue().getUpdatedAt().getTime() > before.getTime());
    }

    @Test
    void whenSaveThrows_thenPropagates() {
        User u = new User(1L, "e@mail", "01", "h", "N", "", "", "", "USER", true, new Timestamp(0), new Timestamp(0));
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(userRepository.save(any())).thenThrow(new RuntimeException("db"));

        assertThrows(RuntimeException.class, () -> sut.execute(1L));
        verify(userRepository).save(any());
    }

    @Test
    void whenAlreadyInactive_thenStillUpdatesUpdatedAtAndSavesOnce() {
        Timestamp before = new Timestamp(0);
        User u = new User(1L, "e@mail", "01", "h", "N", "", "", "", "USER", false, before, before);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        sut.execute(1L);

        ArgumentCaptor<User> cap = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(cap.capture());
        assertFalse(Boolean.TRUE.equals(cap.getValue().getIsActive()));
        assertTrue(cap.getValue().getUpdatedAt().getTime() > before.getTime());
    }
}