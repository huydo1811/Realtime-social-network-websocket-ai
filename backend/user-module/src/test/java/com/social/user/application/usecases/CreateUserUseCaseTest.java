package com.social.user.application.usecases;

import java.sql.Timestamp;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.social.user.application.services.PasswordService;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

@ExtendWith(MockitoExtension.class)
class CreateUserUseCaseTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordService passwordService;

    @InjectMocks
    private CreateUserUseCase sut;

    // Kiểm tra rằng nếu email đã tồn tại trong hệ thống, phương thức execute sẽ ném ra RuntimeException và không gọi phương thức save của userRepository.
    @Test
    void whenEmailExists_thenThrow() {
        when(userRepository.findByEmail("a@x.com")).thenReturn(Optional.of(new User()));
        assertThrows(RuntimeException.class, () ->
            sut.execute("a@x.com", "0123", "pw", "Full Name", "bio", "avatar", "cover", "USER")
        );
        verify(userRepository, never()).save(any());
    }

    // Kiểm tra rằng nếu số điện thoại đã tồn tại trong hệ thống, phương thức execute sẽ ném ra RuntimeException và không gọi phương thức save của userRepository.
    @Test
    void whenPhoneExists_thenThrow() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(userRepository.findByPhone("0123")).thenReturn(Optional.of(new User()));
        assertThrows(RuntimeException.class, () ->
            sut.execute("a@x.com", "0123", "pw", "Full Name", "bio", "avatar", "cover", "USER")
        );
        verify(userRepository, never()).save(any());
    }


    //
    @Test
    void whenValid_thenHashAndSave() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(userRepository.findByPhone(any())).thenReturn(Optional.empty());
        when(passwordService.hashPassword("pw")).thenReturn("HASHED_PW");

        User saved = new User(2L, "a@x.com", "0123", "HASHED_PW", "Full Name", "bio", "avatar", "cover", "USER", true, new Timestamp(0), new Timestamp(0));
        when(userRepository.save(any())).thenReturn(saved);

        User result = sut.execute("a@x.com", "0123", "pw", "Full Name", "bio", "avatar", "cover", "USER");

        assertNotNull(result);
        assertEquals(Long.valueOf(2L), result.getId());
        verify(passwordService).hashPassword("pw");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(1)).save(captor.capture());
        User toSave = captor.getValue();

        assertEquals("a@x.com", toSave.getEmail());
        assertEquals("0123", toSave.getPhone());
        assertEquals("HASHED_PW", toSave.getPasswordHash());
        assertEquals("Full Name", toSave.getFullName());
        assertEquals("bio", toSave.getBio());
        assertEquals("avatar", toSave.getAvatarUrl());
        assertEquals("cover", toSave.getCoverUrl());
        assertEquals("USER", toSave.getRole());
        assertTrue(Boolean.TRUE.equals(toSave.getIsActive()));
        assertNotNull(toSave.getCreatedAt());
        assertNotNull(toSave.getUpdatedAt());
        assertEquals(toSave.getCreatedAt().getTime() <= toSave.getUpdatedAt().getTime(), true);
    }

    // Kiểm tra rằng nếu PasswordService ném ra lỗi khi hash password, thì lỗi đó sẽ được propagate và phương thức save của userRepository sẽ không được gọi.
    @Test
    void whenPasswordServiceThrows_thenPropagates() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(userRepository.findByPhone(any())).thenReturn(Optional.empty());
        when(passwordService.hashPassword("pw")).thenThrow(new RuntimeException("hash failed"));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
            sut.execute("a@x.com", "0123", "pw", "Full Name", "bio", "", "", "USER")
        );
        assertEquals("hash failed", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    // Kiểm tra rằng nếu userRepository ném ra lỗi khi gọi phương thức save, thì lỗi đó sẽ được propagate.
    @Test
    void whenRepositorySaveThrows_thenPropagates() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(userRepository.findByPhone(any())).thenReturn(Optional.empty());
        when(passwordService.hashPassword("pw")).thenReturn("HASHED_PW");
        when(userRepository.save(any())).thenThrow(new RuntimeException("db error"));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
            sut.execute("a@x.com", "0123", "pw", "Full Name", "bio", "", "", "USER")
        );
        assertEquals("db error", ex.getMessage());
    }

    // Kiểm tra rằng nếu role được truyền vào là null hoặc blank, thì nó sẽ được mặc định thành "USER" khi lưu vào database.
    @Test
    void whenRoleIsNull_thenDefaultToUSER() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(userRepository.findByPhone(any())).thenReturn(Optional.empty());
        when(passwordService.hashPassword("pw")).thenReturn("HASHED_PW");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        when(userRepository.save(captor.capture())).thenAnswer(inv -> {
            User in = captor.getValue();
            in.setId(1L);
            return in;
        });

        User result = sut.execute("a@x.com", "0123", "pw", "Full Name", "bio", "avatar", "cover", null);

        assertNotNull(result);
        assertEquals("USER", captor.getValue().getRole());
    }
}