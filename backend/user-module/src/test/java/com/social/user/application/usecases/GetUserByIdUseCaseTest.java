package com.social.user.application.usecases;

import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GetUserByIdUseCaseTest {
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private GetUserByIdUseCase sut;

    //Khi user tồn tại
    @Test
    void whenExists_thenReturnUser() {
        User u = new User(1L, "e@mail", "012", "h", "Full", "bio", "", "", "USER", true, new Timestamp(0), new Timestamp(0));
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        User res = sut.execute(1L);
        assertNotNull(res);
        assertEquals(1L, res.getId().longValue());
        verify(userRepository).findById(1L);
    }

    //Khi không tìm thấy
    @Test
    void whenNotExists_thenThrowWithMessage() {
        when(userRepository.findById(2L)).thenReturn(Optional.empty());
        RuntimeException ex = assertThrows(RuntimeException.class, () -> sut.execute(2L));
        assertEquals("Người dùng không tồn tại", ex.getMessage());
        verify(userRepository).findById(2L);
    }

    //Khi repo ném lỗi thì lỗi được truyền ra ngoài
    @Test
    void whenRepoThrows_thenPropagates() {
        when(userRepository.findById(1L)).thenThrow(new RuntimeException("db"));
        RuntimeException ex = assertThrows(RuntimeException.class, () -> sut.execute(1L));
        assertEquals("db", ex.getMessage());
        verify(userRepository).findById(1L);
    }
}