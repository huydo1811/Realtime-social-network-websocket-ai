package com.social.auth.presentation.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.social.auth.application.usecases.AuthenticateUseCase;
import com.social.auth.application.usecases.LogoutUseCase;
import com.social.auth.application.usecases.RefreshTokenUseCase;
import com.social.auth.application.usecases.RegisterUseCase;
import com.social.auth.presentation.dto.AuthResponseDto;
import com.social.auth.presentation.dto.LoginDto;
import com.social.auth.presentation.dto.ProfileDto;
import com.social.auth.presentation.dto.RefreshRequestDto;
import com.social.auth.presentation.dto.RegisterDto;
import com.social.auth.presentation.mapper.AuthMapper;
import com.social.user.domain.entities.User;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final RegisterUseCase registerUseCase;
    private final AuthenticateUseCase authenticateUseCase;
    private final RefreshTokenUseCase refreshTokenUseCase;
    private final LogoutUseCase logoutUseCase;
    private final AuthMapper authMapper;

    public AuthController(RegisterUseCase registerUseCase,
                          AuthenticateUseCase authenticateUseCase,
                          RefreshTokenUseCase refreshTokenUseCase,
                          LogoutUseCase logoutUseCase,
                          AuthMapper authMapper) {
        this.registerUseCase = registerUseCase;
        this.authenticateUseCase = authenticateUseCase;
        this.refreshTokenUseCase = refreshTokenUseCase;
        this.logoutUseCase = logoutUseCase;
        this.authMapper = authMapper;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterDto dto) {
        try {
            User created = registerUseCase.execute(dto);
            ProfileDto profile = authMapper.toProfileDto(created);
            return ResponseEntity.ok(profile);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Đã xảy ra lỗi hệ thống");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDto dto) {
        try {
            AuthResponseDto resp = authenticateUseCase.authenticate(dto);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(401).body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Đã xảy ra lỗi hệ thống");
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody RefreshRequestDto dto) {
        try {
            AuthResponseDto resp = refreshTokenUseCase.refresh(dto.getRefreshToken());
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(401).body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Đã xảy ra lỗi hệ thống");
        }
    }
    

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequestDto dto) {
        logoutUseCase.logout(dto.getRefreshToken());
        return ResponseEntity.ok().build();
    }
}