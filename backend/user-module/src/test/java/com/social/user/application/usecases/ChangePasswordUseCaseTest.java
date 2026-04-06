package com.social.user.application.usecases;

import java.sql.Timestamp;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.social.user.application.services.PasswordService;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

@ExtendWith(MockitoExtension.class)
class ChangePasswordUseCaseTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordService passwordService;
    @InjectMocks private ChangePasswordUseCase sut;

    private User makeUser(Long id, String hash) {
        return new User(id, "u"+id+"@x.com", "0123", hash, "Full", null, null, null, "USER", true, new Timestamp(0), new Timestamp(0));
    }

    @Test
    void execute_success_changesHashAndSaves() {
        User existing = makeUser(1L, "old-hash");
        when(userRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(passwordService.verifyPassword("oldpw", "old-hash")).thenReturn(true);
        when(passwordService.hashPassword("newpw")).thenReturn("new-hash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = sut.execute(1L, "oldpw", "newpw");

        ArgumentCaptor<User> cap = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(cap.capture());
        User saved = cap.getValue();

        assertEquals("new-hash", saved.getPasswordHash());
        assertEquals(saved.getId(), result.getId());
    }

    @Test
    void execute_wrongCurrent_throwsIllegalArgumentException() {
        User existing = makeUser(2L, "old-hash");
        when(userRepository.findById(2L)).thenReturn(Optional.of(existing));
        when(passwordService.verifyPassword("bad", "old-hash")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> sut.execute(2L, "bad", "newpw"));
    }

    @Test
    void execute_userNotFound_throwsRuntimeException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> sut.execute(99L, "any", "newpw"));
    }
}
