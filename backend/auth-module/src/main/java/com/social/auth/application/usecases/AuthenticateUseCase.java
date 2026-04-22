package com.social.auth.application.usecases;

import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.auth.infrastructure.persistence.RefreshToken;
import com.social.auth.infrastructure.persistence.RefreshTokenRepository;
import com.social.auth.infrastructure.security.JwtService;
import com.social.auth.infrastructure.service.OtpService;
import com.social.auth.presentation.dto.AuthResponseDto;
import com.social.auth.presentation.dto.LoginDto;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

@Service
public class AuthenticateUseCase {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OtpService otpService;

    @Value("${security.jwt.exp-refresh-seconds:604800}") 
    private long refreshExpSeconds;

    public AuthenticateUseCase(UserRepository userRepository,
                               PasswordEncoder passwordEncoder,
                               JwtService jwtService,
                               RefreshTokenRepository refreshTokenRepository,
                               OtpService otpService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.otpService = otpService;
    }

    @Transactional
    public AuthResponseDto authenticate(LoginDto dto) {
        User user = userRepository.findByEmail(dto.getEmail())
            .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (user.getIsActive() == null || !user.getIsActive()) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        if (!passwordEncoder.matches(dto.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        // Consume only after credentials are valid
        otpService.consumeVerifiedSession(dto.getOtpSessionToken(), dto.getEmail(), "EMAIL", "LOGIN");

        String access = jwtService.generateAccessToken(user);
        String refreshVal = jwtService.generateRefreshTokenValue();

        RefreshToken rt = new RefreshToken();
        rt.setToken(refreshVal);
        rt.setUserId(user.getId());
        rt.setExpiryDate(Instant.now().plusSeconds(refreshExpSeconds));
        refreshTokenRepository.save(rt);

        AuthResponseDto resp = new AuthResponseDto();
        resp.setAccessToken(access);
        resp.setRefreshToken(refreshVal);
        resp.setExpiresIn(jwtService.getAccessExpiresInSeconds());
        return resp;
    }
}