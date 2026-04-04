package com.social.auth.application.usecases;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import java.util.Optional;

import com.social.auth.infrastructure.persistence.RefreshToken;
import com.social.auth.infrastructure.persistence.RefreshTokenRepository;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    "security.jwt.secret=REPLACE_WITH_STRONG_BASE64_SECRET",
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
public class LogoutUseCaseTest {

    @Autowired
    LogoutUseCase logoutUseCase;

    @Autowired
    RefreshTokenRepository refreshTokenRepository;

    @Autowired
    UserRepository userRepository;

    @Test
    void logout_marksRefreshTokenRevoked() {
        User u = new User();
        u.setEmail("logout@example.com");
        u.setPasswordHash("x");
        u.setFullName("Logout User");
        u.setIsActive(true);
        User saved = userRepository.save(u);

        RefreshToken rt = new RefreshToken();
        rt.setToken("to-logout-token");
        rt.setUserId(saved.getId());
        rt.setExpiryDate(Instant.now().plusSeconds(3600));
        rt.setRevoked(false);
        refreshTokenRepository.save(rt);

        logoutUseCase.logout("to-logout-token");

        Optional<RefreshToken> opt = refreshTokenRepository.findByToken("to-logout-token");
        assertThat(opt).isPresent();
        assertThat(opt.get().isRevoked()).isTrue();
    }

    @Test
    void logout_withInvalidToken_isNoOp() {
        // should not throw, repository remains empty for that token
        logoutUseCase.logout("invalid-token");
        assertThat(refreshTokenRepository.findByToken("invalid-token")).isEmpty();
    }

    @Test
    void logout_onAlreadyRevokedToken_isIdempotent() {
        User u = new User();
        u.setEmail("already@example.com");
        u.setPasswordHash("x");
        u.setFullName("Already");
        u.setIsActive(true);
        User saved = userRepository.save(u);

        RefreshToken rt = new RefreshToken();
        rt.setToken("already-revoked");
        rt.setUserId(saved.getId());
        rt.setExpiryDate(Instant.now().plusSeconds(3600));
        rt.setRevoked(true);
        refreshTokenRepository.save(rt);

        // should not error and remains revoked
        logoutUseCase.logout("already-revoked");
        Optional<RefreshToken> opt = refreshTokenRepository.findByToken("already-revoked");
        assertThat(opt).isPresent();
        assertThat(opt.get().isRevoked()).isTrue();
    }
}