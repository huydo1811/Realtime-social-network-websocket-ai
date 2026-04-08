package com.social.auth.infrastructure.service;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.auth.application.exceptions.InvalidOtpException;
import com.social.auth.infrastructure.adapters.EmailSender;
import com.social.auth.infrastructure.adapters.SmsSender;
import com.social.auth.infrastructure.persistence.OtpEntity;
import com.social.auth.infrastructure.persistence.OtpRepository;

@Service
public class OtpServiceImpl implements OtpService {

    private final OtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailSender emailSender;
    private final SmsSender smsSender;

    private final int otpTtlSeconds = 300;
    private final int sessionTtlSeconds = 900;
    private final int maxAttempts = 5;

    public OtpServiceImpl(OtpRepository otpRepository,
                          PasswordEncoder passwordEncoder,
                          EmailSender emailSender,
                          SmsSender smsSender) {
        this.otpRepository = otpRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailSender = emailSender;
        this.smsSender = smsSender;
    }

    @Override
    @Transactional
    public void generateAndSend(String contact, String contactType, String purpose) {
        String code = generateNumericOtp(6);

        OtpEntity e = new OtpEntity();
        e.setContact(contact);
        e.setContactType(contactType);
        e.setPurpose(purpose);
        e.setCodeHash(passwordEncoder.encode(code));
        e.setExpiresAt(LocalDateTime.now().plusSeconds(otpTtlSeconds));
        e.setUsed(false);
        e.setAttempts(0);
        otpRepository.save(e);

        if ("EMAIL".equalsIgnoreCase(contactType)) {
            emailSender.send(contact, "Your OTP code", "Mã OTP của bạn: " + code);
        } else {
            smsSender.send(contact, "Mã OTP: " + code);
        }
    }

    @Override
    @Transactional
    public String verifyAndIssueSessionToken(String contact, String contactType, String code, String purpose) {
        OtpEntity e = otpRepository
                .findFirstByContactAndContactTypeAndPurposeAndUsedFalseOrderByCreatedAtDesc(contact, contactType, purpose)
                .orElseThrow(InvalidOtpException::new);

        if (e.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidOtpException();
        }

        if (e.getAttempts() >= maxAttempts) {
            e.setUsed(true);
            otpRepository.save(e);
            throw new InvalidOtpException();
        }

        if (!passwordEncoder.matches(code, e.getCodeHash())) {
            e.setAttempts(e.getAttempts() + 1);
            otpRepository.save(e);
            throw new InvalidOtpException();
        }

        e.setUsed(true);

        String rawSession = UUID.randomUUID().toString();
        e.setSessionTokenHash(passwordEncoder.encode(rawSession));
        e.setSessionExpiresAt(LocalDateTime.now().plusSeconds(sessionTtlSeconds));
        e.setSessionUsed(false);
        e.setVerifiedAt(LocalDateTime.now());

        otpRepository.save(e);
        return rawSession;
    }

    @Override
    @Transactional
    public void consumeVerifiedSession(String otpSessionToken, String contact, String contactType, String purpose) {
        OtpEntity e = otpRepository
                .findFirstByContactAndContactTypeAndPurposeAndSessionUsedFalseOrderByVerifiedAtDesc(contact, contactType, purpose)
                .orElseThrow(InvalidOtpException::new);

        if (e.getSessionExpiresAt() == null || e.getSessionExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidOtpException();
        }

        if (e.getSessionTokenHash() == null || !passwordEncoder.matches(otpSessionToken, e.getSessionTokenHash())) {
            throw new InvalidOtpException();
        }

        e.setSessionUsed(true);
        otpRepository.save(e);
    }

    private String generateNumericOtp(int digits) {
        Random rnd = new Random();
        int min = (int) Math.pow(10, digits - 1);
        int num = rnd.nextInt(9 * min) + min;
        return String.valueOf(num);
    }
}