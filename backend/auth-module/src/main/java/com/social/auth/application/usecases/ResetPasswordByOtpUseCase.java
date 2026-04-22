package com.social.auth.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.auth.infrastructure.service.OtpService;
import com.social.auth.presentation.dto.ResetPasswordByOtpDto;
import com.social.user.application.services.PasswordService;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

@Service
public class ResetPasswordByOtpUseCase {

  private final OtpService otpService;
  private final UserRepository userRepository;
  private final PasswordService passwordService;

  public ResetPasswordByOtpUseCase(
    OtpService otpService,
    UserRepository userRepository,
    PasswordService passwordService
  ) {
    this.otpService = otpService;
    this.userRepository = userRepository;
    this.passwordService = passwordService;
  }

  @Transactional
  public void execute(ResetPasswordByOtpDto dto) {
    otpService.consumeVerifiedSession(
      dto.getOtpSessionToken(),
      dto.getEmail(),
      "EMAIL",
      "RESET_PASSWORD"
    );

    User user = userRepository.findByEmail(dto.getEmail())
      .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

    user.setPasswordHash(passwordService.hashPassword(dto.getNewPassword()));
    userRepository.save(user);
  }
}
