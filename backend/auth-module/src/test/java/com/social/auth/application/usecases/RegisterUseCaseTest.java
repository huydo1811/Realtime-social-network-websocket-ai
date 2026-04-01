package com.social.auth.application.usecases;

import java.sql.Timestamp;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.social.auth.presentation.dto.RegisterDto;
import com.social.user.application.usecases.CreateUserUseCase;
import com.social.user.domain.entities.User;

@ExtendWith(MockitoExtension.class)
class RegisterUseCaseTest {

    @Mock
    CreateUserUseCase createUserUseCase;

    @InjectMocks
    RegisterUseCase sut;

    //Khi register thành công, nó sẽ gọi createUserUseCase với đúng tham số và trả về user đã tạo
    @Test
    void register_calls_createUserUseCase_and_returns_user() {
        RegisterDto dto = new RegisterDto();
        dto.setEmail("a@x.com");
        dto.setPhone("012345");
        dto.setPassword("pw");
        dto.setFullName("Full Name");

        User u = new User(1L, "a@x.com", "012345", "pwhash", "Full Name", null, null, null, "USER", true, new Timestamp(System.currentTimeMillis()), new Timestamp(System.currentTimeMillis()));
        when(createUserUseCase.execute(dto.getEmail(), dto.getPhone(), dto.getPassword(), dto.getFullName(), dto.getBio(), dto.getAvatarUrl(), dto.getCoverUrl(), dto.getRole())).thenReturn(u);

        User res = sut.execute(dto);

        assertNotNull(res);
        verify(createUserUseCase).execute(dto.getEmail(), dto.getPhone(), dto.getPassword(), dto.getFullName(), dto.getBio(), dto.getAvatarUrl(), dto.getCoverUrl(), dto.getRole());
    }

    //Khi createUserUseCase ném ra exception (ví dụ do email đã tồn tại), thì register sẽ không bắt mà sẽ để exception đó propagate lên caller, và test sẽ assert rằng exception đó được ném ra
    @Test
    void register_propagates_exception_from_createUser() {
        RegisterDto dto = new RegisterDto();
        dto.setEmail("a@x.com");
        dto.setPhone("012345");
        dto.setPassword("pw");
        dto.setFullName("Full Name");

        RuntimeException ex = new RuntimeException("duplicate");
        when(createUserUseCase.execute(dto.getEmail(), dto.getPhone(), dto.getPassword(), dto.getFullName(), dto.getBio(), dto.getAvatarUrl(), dto.getCoverUrl(), dto.getRole())).thenThrow(ex);

        assertThrows(RuntimeException.class, () -> sut.execute(dto));
        verify(createUserUseCase).execute(dto.getEmail(), dto.getPhone(), dto.getPassword(), dto.getFullName(), dto.getBio(), dto.getAvatarUrl(), dto.getCoverUrl(), dto.getRole());
    }
}