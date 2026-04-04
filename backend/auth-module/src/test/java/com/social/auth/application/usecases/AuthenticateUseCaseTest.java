package com.social.auth.application.usecases;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.social.auth.infrastructure.persistence.RefreshToken;
import com.social.auth.infrastructure.persistence.RefreshTokenRepository;
import com.social.auth.infrastructure.security.JwtService;
import com.social.auth.presentation.dto.LoginDto;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

@SpringBootTest(properties = {
    "security.jwt.secret=REPLACE_WITH_STRONG_BASE64_SECRET",
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
public class AuthenticateUseCaseTest {

    @Autowired
    AuthenticateUseCase authenticateUseCase;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RefreshTokenRepository refreshTokenRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    JwtService jwtService;

    // Đăng nhập thành công với email và mật khẩu hợp lệ, trả về access token và refresh token mới, đồng thời lưu refresh token vào cơ sở dữ liệu
    @Test
    void authenticate_createsTokensAndPersistsRefreshToken() {
        User u = new User();
        u.setEmail("test@example.com");
        u.setPasswordHash(passwordEncoder.encode("Password123!"));
        u.setFullName("Test User");
        u.setIsActive(true);
        User saved = userRepository.save(u);

        LoginDto dto = new LoginDto();
        dto.setEmail("test@example.com");
        dto.setPassword("Password123!");

        var resp = authenticateUseCase.authenticate(dto);

        assertThat(resp).isNotNull();
        assertThat(resp.getAccessToken()).isNotBlank();
        assertThat(resp.getRefreshToken()).isNotBlank();
        assertThat(resp.getExpiresIn()).isGreaterThan(0);

        Optional<RefreshToken> rtOpt = refreshTokenRepository.findByToken(resp.getRefreshToken());
        assertThat(rtOpt).isPresent();
        RefreshToken rt = rtOpt.get();
        assertThat(rt.getUserId()).isEqualTo(saved.getId());
        assertThat(rt.getExpiryDate()).isAfter(Instant.now());

        assertThat(jwtService.validateToken(resp.getAccessToken())).isTrue();
        assertThat(jwtService.getSubject(resp.getAccessToken())).isEqualTo(String.valueOf(saved.getId()));
    }

    // Đăng nhập với email không tồn tại hoặc mật khẩu sai sẽ ném IllegalArgumentException
    @Test
    void authenticate_withInvalidCredentials_throws() {
        User u = new User();
        u.setEmail("bad@example.com");
        u.setPasswordHash(passwordEncoder.encode("RightPassword"));
        u.setFullName("Bad User");
        u.setIsActive(true);
        userRepository.save(u);

        LoginDto dto = new LoginDto();
        dto.setEmail("bad@example.com");
        dto.setPassword("WrongPassword");

        assertThrows(IllegalArgumentException.class, () -> authenticateUseCase.authenticate(dto));
    }

    // Đăng nhập với user không hoạt động sẽ ném IllegalArgumentException
    @Test
    void authenticate_withInactiveUser_throws() {
        User u = new User();
        u.setEmail("inactive@example.com");
        u.setPasswordHash(passwordEncoder.encode("Password123!"));
        u.setFullName("Inactive User");
        u.setIsActive(false);
        userRepository.save(u);

        LoginDto dto = new LoginDto();
        dto.setEmail("inactive@example.com");
        dto.setPassword("Password123!");

        assertThrows(IllegalArgumentException.class, () -> authenticateUseCase.authenticate(dto));
    }
}