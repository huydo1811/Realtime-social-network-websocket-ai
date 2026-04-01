package com.social.auth.presentation.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import com.social.auth.application.usecases.RegisterUseCase;
import com.social.auth.presentation.dto.RegisterDto;
import com.social.auth.presentation.dto.ProfileDto;
import com.social.auth.presentation.mapper.AuthMapper;
import com.social.user.domain.entities.User;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final RegisterUseCase registerUseCase;
    private final AuthMapper authMapper;

    public AuthController(RegisterUseCase registerUseCase, AuthMapper authMapper) {
        this.registerUseCase = registerUseCase;
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
}