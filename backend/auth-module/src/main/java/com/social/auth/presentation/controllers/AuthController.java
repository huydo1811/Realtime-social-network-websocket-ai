package com.social.auth.presentation.controllers;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.social.auth.application.usecases.AuthenticateUseCase;
import com.social.auth.application.usecases.CheckAdminUseCase;
import com.social.auth.application.usecases.LogoutUseCase;
import com.social.auth.application.usecases.RefreshTokenUseCase;
import com.social.auth.application.usecases.RegisterUseCase;
import com.social.auth.application.usecases.RequestOtpUseCase;
import com.social.auth.application.usecases.ResetPasswordByOtpUseCase;
import com.social.auth.application.usecases.VerifyOtpUseCase;
import com.social.auth.presentation.dto.AuthResponseDto;
import com.social.auth.presentation.dto.ChangePasswordDto;
import com.social.auth.presentation.dto.LoginDto;
import com.social.auth.presentation.dto.ProfileDto;
import com.social.auth.presentation.dto.RefreshRequestDto;
import com.social.auth.presentation.dto.RegisterDto;
import com.social.auth.presentation.dto.RequestOtpDto;
import com.social.auth.presentation.dto.ResetPasswordByOtpDto;
import com.social.auth.presentation.dto.VerifyOtpDto;
import com.social.auth.presentation.mapper.AuthMapper;
import com.social.user.application.usecases.ChangePasswordUseCase;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final RegisterUseCase registerUseCase;
    private final AuthenticateUseCase authenticateUseCase;
    private final RefreshTokenUseCase refreshTokenUseCase;
    private final LogoutUseCase logoutUseCase;
    private final AuthMapper authMapper;
    private final ChangePasswordUseCase changePasswordUseCase;
    private final RequestOtpUseCase requestOtpUseCase;
    private final VerifyOtpUseCase verifyOtpUseCase;
    private final ResetPasswordByOtpUseCase resetPasswordByOtpUseCase;
    private final CheckAdminUseCase checkAdminUseCase;
    @Autowired
    private UserRepository userRepository;

    public AuthController(RegisterUseCase registerUseCase,
                          AuthenticateUseCase authenticateUseCase,
                          RefreshTokenUseCase refreshTokenUseCase,
                          LogoutUseCase logoutUseCase,
                          AuthMapper authMapper,
                          ChangePasswordUseCase changePasswordUseCase,
                          RequestOtpUseCase requestOtpUseCase,
                          VerifyOtpUseCase verifyOtpUseCase,
                          ResetPasswordByOtpUseCase resetPasswordByOtpUseCase,
                          CheckAdminUseCase checkAdminUseCase) {
        this.registerUseCase = registerUseCase;
        this.authenticateUseCase = authenticateUseCase;
        this.refreshTokenUseCase = refreshTokenUseCase;
        this.logoutUseCase = logoutUseCase;
        this.authMapper = authMapper;
        this.changePasswordUseCase = changePasswordUseCase;
        this.requestOtpUseCase = requestOtpUseCase;
        this.verifyOtpUseCase = verifyOtpUseCase;
        this.resetPasswordByOtpUseCase = resetPasswordByOtpUseCase;
        this.checkAdminUseCase = checkAdminUseCase;
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

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordDto dto) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getPrincipal() == null) {
                return ResponseEntity.status(401).body("Unauthorized");
            }
            String principal = (String) auth.getPrincipal();
            Long userId = Long.valueOf(principal);
            changePasswordUseCase.execute(userId, dto.getCurrentPassword(), dto.getNewPassword());
            return ResponseEntity.ok("Đổi mật khẩu thành công");
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(500).body("Đã xảy ra lỗi hệ thống");
        }
    }

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@Valid @RequestBody RequestOtpDto dto) {
        try {
            requestOtpUseCase.execute(dto.getContact(), dto.getContactType(), dto.getPurpose());
            return ResponseEntity.ok(Map.of("status", "OTP_SENT"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("error", "UNABLE_TO_SEND"));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpDto dto) {
        try {
            String otpSessionToken = verifyOtpUseCase.execute(
                dto.getContact(), dto.getContactType(), dto.getCode(), dto.getPurpose()
            );
            return ResponseEntity.ok(Map.of(
                "otpSessionToken", otpSessionToken,
                "expiresIn", 900
            ));
        } catch (Exception ex) {
            return ResponseEntity.status(400).body(Map.of("error", "INVALID_OR_EXPIRED"));
        }
    }
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordByOtpDto dto) {
    try {
        resetPasswordByOtpUseCase.execute(dto);
        return ResponseEntity.ok(Map.of("status", "PASSWORD_RESET_SUCCESS"));
    } catch (RuntimeException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    } catch (Exception ex) {
        return ResponseEntity.status(500).body("Đã xảy ra lỗi hệ thống");
    }
    }

    @GetMapping("/check-admin")
    public ResponseEntity<?> checkAdminRole(@RequestParam String email) {
        boolean isAdmin = checkAdminUseCase.execute(email);
        return ResponseEntity.ok(isAdmin);
    }
}