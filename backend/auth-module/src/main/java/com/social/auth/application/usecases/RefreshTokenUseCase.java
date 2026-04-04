package com.social.auth.application.usecases;

import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.auth.infrastructure.persistence.RefreshToken;
import com.social.auth.infrastructure.persistence.RefreshTokenRepository;
import com.social.auth.infrastructure.security.JwtService;
import com.social.auth.presentation.dto.AuthResponseDto;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

@Service
public class RefreshTokenUseCase {

    @Value("${security.jwt.exp-refresh-seconds:604800}")
    private long refreshExpSeconds;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public RefreshTokenUseCase(RefreshTokenRepository refreshTokenRepository,
                               JwtService jwtService,
                               UserRepository userRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Transactional
    public AuthResponseDto refresh(String refreshTokenValue) {
        RefreshToken existing = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        if (existing.isRevoked() || existing.getExpiryDate().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Refresh token expired or revoked");
        }

        User user = userRepository.findById(existing.getUserId())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        // revoke old and rotate
        existing.setRevoked(true);
        refreshTokenRepository.save(existing);

        String newAccess = jwtService.generateAccessToken(user);
        String newRefreshVal = jwtService.generateRefreshTokenValue();

        RefreshToken newRt = new RefreshToken();
        newRt.setToken(newRefreshVal);
        newRt.setUserId(user.getId());
        newRt.setExpiryDate(Instant.now().plusSeconds(refreshExpSeconds));        refreshTokenRepository.save(newRt);

        AuthResponseDto resp = new AuthResponseDto();
        resp.setAccessToken(newAccess);
        resp.setRefreshToken(newRefreshVal);
        resp.setExpiresIn(jwtService.getAccessExpiresInSeconds());
        return resp;
    }
}