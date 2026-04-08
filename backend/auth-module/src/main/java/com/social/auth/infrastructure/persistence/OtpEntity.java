package com.social.auth.infrastructure.persistence;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "otps")
public class OtpEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String contact;

    @Column(name = "contact_type", nullable = false)
    private String contactType;

    @Column(name = "code_hash", nullable = false)
    private String codeHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    @Column(nullable = false)
    private int attempts = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private String purpose;

    @Column(name = "session_token_hash")
    private String sessionTokenHash;

    @Column(name = "session_expires_at")
    private LocalDateTime sessionExpiresAt;

    @Column(name = "session_used", nullable = false)
    private boolean sessionUsed = false;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
    public String getContactType() { return contactType; }
    public void setContactType(String contactType) { this.contactType = contactType; }
    public String getCodeHash() { return codeHash; }
    public void setCodeHash(String codeHash) { this.codeHash = codeHash; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }
    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public String getSessionTokenHash() { return sessionTokenHash; }
    public void setSessionTokenHash(String sessionTokenHash) { this.sessionTokenHash = sessionTokenHash; }
    public LocalDateTime getSessionExpiresAt() { return sessionExpiresAt; }
    public void setSessionExpiresAt(LocalDateTime sessionExpiresAt) { this.sessionExpiresAt = sessionExpiresAt; }
    public boolean isSessionUsed() { return sessionUsed; }
    public void setSessionUsed(boolean sessionUsed) { this.sessionUsed = sessionUsed; }
    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }
}