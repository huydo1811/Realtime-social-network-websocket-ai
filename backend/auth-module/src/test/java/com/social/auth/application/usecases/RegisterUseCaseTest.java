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

import com.social.auth.infrastructure.service.OtpService;
import com.social.auth.presentation.dto.RegisterDto;
import com.social.user.application.usecases.CreateUserUseCase;
import com.social.user.domain.entities.User;

@ExtendWith(MockitoExtension.class)
class RegisterUseCaseTest {

    @Mock
    CreateUserUseCase createUserUseCase;

    @Mock
    OtpService otpService;

    @InjectMocks
    RegisterUseCase sut;

    @Test
    void register_calls_createUserUseCase_and_returns_user() {
        RegisterDto dto = new RegisterDto();
        dto.setEmail("a@x.com");
        dto.setPhone("012345");
        dto.setPassword("pw");
        dto.setFullName("Full Name");
        dto.setOtpSessionToken("otp-session-1");

        User u = new User(1L, "a@x.com", "012345", "pwhash", "Full Name", null, null, null, "USER", true,
                new Timestamp(System.currentTimeMillis()), new Timestamp(System.currentTimeMillis()));

        when(createUserUseCase.execute(
                dto.getEmail(), dto.getPhone(), dto.getPassword(), dto.getFullName(),
                dto.getBio(), dto.getAvatarUrl(), dto.getCoverUrl(), dto.getRole()
        )).thenReturn(u);

        User res = sut.execute(dto);

        assertNotNull(res);
        verify(otpService).consumeVerifiedSession("otp-session-1", "a@x.com", "EMAIL", "REGISTER");
        verify(createUserUseCase).execute(
                dto.getEmail(), dto.getPhone(), dto.getPassword(), dto.getFullName(),
                dto.getBio(), dto.getAvatarUrl(), dto.getCoverUrl(), dto.getRole()
        );
    }

    @Test
    void register_propagates_exception_from_createUser() {
        RegisterDto dto = new RegisterDto();
        dto.setEmail("a@x.com");
        dto.setPhone("012345");
        dto.setPassword("pw");
        dto.setFullName("Full Name");
        dto.setOtpSessionToken("otp-session-1");

        RuntimeException ex = new RuntimeException("duplicate");
        when(createUserUseCase.execute(
                dto.getEmail(), dto.getPhone(), dto.getPassword(), dto.getFullName(),
                dto.getBio(), dto.getAvatarUrl(), dto.getCoverUrl(), dto.getRole()
        )).thenThrow(ex);

        assertThrows(RuntimeException.class, () -> sut.execute(dto));

        verify(otpService).consumeVerifiedSession("otp-session-1", "a@x.com", "EMAIL", "REGISTER");
        verify(createUserUseCase).execute(
                dto.getEmail(), dto.getPhone(), dto.getPassword(), dto.getFullName(),
                dto.getBio(), dto.getAvatarUrl(), dto.getCoverUrl(), dto.getRole()
        );
    }
}