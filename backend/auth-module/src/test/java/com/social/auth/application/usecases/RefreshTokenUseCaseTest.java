package com.social.auth.application.usecases;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.social.auth.infrastructure.persistence.RefreshToken;
import com.social.auth.infrastructure.persistence.RefreshTokenRepository;
import com.social.auth.infrastructure.security.JwtService;
import com.social.auth.presentation.dto.AuthResponseDto;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

@SpringBootTest(properties = {
    "security.jwt.secret=REPLACE_WITH_STRONG_BASE64_SECRET",
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "security.jwt.exp-refresh-seconds=3600"
})
public class RefreshTokenUseCaseTest {

    @Autowired
    RefreshTokenRepository refreshTokenRepository;

    @Autowired
    RefreshTokenUseCase refreshTokenUseCase;

    @Autowired
    UserRepository userRepository;

    @Autowired
    JwtService jwtService;

    //Khi làm mới token với refresh token hợp lệ, nó sẽ trả về access token và refresh token mới, đồng thời thu hồi refresh token cũ và lưu refresh token mới vào cơ sở dữ liệu
    @Test
    void refresh_rotatesAndReturnsNewTokens() {
        User u = new User();
        u.setEmail("refresh@example.com");
        u.setPasswordHash("x");
        u.setFullName("Refresh User");
        u.setIsActive(true);
        User saved = userRepository.save(u);

        RefreshToken old = new RefreshToken();
        old.setToken("old-refresh-token-1");
        old.setUserId(saved.getId());
        old.setExpiryDate(Instant.now().plusSeconds(3600));
        old.setRevoked(false);
        refreshTokenRepository.save(old);

        AuthResponseDto resp = refreshTokenUseCase.refresh("old-refresh-token-1");

        assertThat(resp).isNotNull();
        assertThat(resp.getAccessToken()).isNotBlank();
        assertThat(resp.getRefreshToken()).isNotBlank();
        assertThat(jwtService.validateToken(resp.getAccessToken())).isTrue();
        assertThat(resp.getRefreshToken()).isNotEqualTo("old-refresh-token-1");

        Optional<RefreshToken> oldOpt = refreshTokenRepository.findByToken("old-refresh-token-1");
        assertThat(oldOpt).isPresent();
        assertThat(oldOpt.get().isRevoked()).isTrue();

        Optional<RefreshToken> newOpt = refreshTokenRepository.findByToken(resp.getRefreshToken());
        assertThat(newOpt).isPresent();
        assertThat(newOpt.get().getUserId()).isEqualTo(saved.getId());
        assertThat(newOpt.get().getExpiryDate()).isAfter(Instant.now());
    }

    // Khi token không tồn tại, nó sẽ ném IllegalArgumentException
    @Test
    void refresh_withNonexistentToken_throws() {
        assertThrows(IllegalArgumentException.class, () -> refreshTokenUseCase.refresh("no-such-token"));
    }

    // Khi token đã bị thu hồi hoặc đã hết hạn, nó sẽ ném IllegalArgumentException
    @Test
    void refresh_withRevokedToken_throws() {
        User u = new User();
        u.setEmail("revoked@example.com");
        u.setPasswordHash("x");
        u.setFullName("Revoked User");
        u.setIsActive(true);
        User saved = userRepository.save(u);

        RefreshToken old = new RefreshToken();
        old.setToken("revoked-token");
        old.setUserId(saved.getId());
        old.setExpiryDate(Instant.now().plusSeconds(3600));
        old.setRevoked(true);
        refreshTokenRepository.save(old);

        assertThrows(IllegalArgumentException.class, () -> refreshTokenUseCase.refresh("revoked-token"));
    }

    // Khi token đã hết hạn, nó sẽ ném IllegalArgumentException
    @Test
    void refresh_withExpiredToken_throws() {
        User u = new User();
        u.setEmail("expired@example.com");
        u.setPasswordHash("x");
        u.setFullName("Expired User");
        u.setIsActive(true);
        User saved = userRepository.save(u);

        RefreshToken old = new RefreshToken();
        old.setToken("expired-token");
        old.setUserId(saved.getId());
        old.setExpiryDate(Instant.now().minusSeconds(10));
        old.setRevoked(false);
        refreshTokenRepository.save(old);

        assertThrows(IllegalArgumentException.class, () -> refreshTokenUseCase.refresh("expired-token"));
    }

    // Khi user liên kết với token đã bị xóa, nó sẽ ném IllegalStateException
    @Test
    void refresh_whenUserDeleted_throws() {
        User u = new User();
        u.setEmail("todelete@example.com");
        u.setPasswordHash("x");
        u.setFullName("ToDelete");
        u.setIsActive(true);
        User saved = userRepository.save(u);

        RefreshToken old = new RefreshToken();
        old.setToken("token-user-deleted");
        old.setUserId(saved.getId());
        old.setExpiryDate(Instant.now().plusSeconds(3600));
        old.setRevoked(false);
        refreshTokenRepository.save(old);

        userRepository.deleteById(saved.getId());

        assertThrows(IllegalStateException.class, () -> refreshTokenUseCase.refresh("token-user-deleted"));    }
}