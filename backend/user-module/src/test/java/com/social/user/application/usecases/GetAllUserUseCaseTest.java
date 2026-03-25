package com.social.user.application.usecases;

import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Timestamp;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GetAllUserUseCaseTest {
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private GetAllUserUseCase sut;

    //Khi có người dùng trong cơ sở dữ liệu, nó sẽ trả về danh sách người dùng đó.
    @Test
    void returnsAllUsers() {
        User a = new User(1L, "a@mail", "01", "h", "A", "", "", "", "USER", true, new Timestamp(0), new Timestamp(0));
        User b = new User(2L, "b@mail", "02", "h", "B", "", "", "", "USER", true, new Timestamp(0), new Timestamp(0));
        when(userRepository.findAll()).thenReturn(List.of(a, b));
        var list = sut.execute();
        assertEquals(2, list.size());
        verify(userRepository).findAll();
    }

    //Khi không có người dùng nào trong cơ sở dữ liệu, nó sẽ trả về một danh sách trống.
    @Test
    void returnsEmptyListWhenNoUsers() {
        when(userRepository.findAll()).thenReturn(List.of());
        var list = sut.execute();
        assertNotNull(list);
        assertTrue(list.isEmpty());
        verify(userRepository).findAll();
    }

    //Khi repository ném lỗi, lỗi đó sẽ được truyền ra ngoài.
    @Test
    void whenFindAllThrows_thenPropagates() {
        when(userRepository.findAll()).thenThrow(new RuntimeException("db"));
        RuntimeException ex = assertThrows(RuntimeException.class, () -> sut.execute());
        assertEquals("db", ex.getMessage());
        verify(userRepository).findAll();
    }
}