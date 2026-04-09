package com.social.auth.infrastructure.security;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.social.user.domain.entities.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.WeakKeyException;
import jakarta.annotation.PostConstruct;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    @Value("${security.jwt.secret:}")
    private String jwtSecretProperty;

    @Value("${security.jwt.exp-access-seconds:900}")
    private long accessExpSeconds;

    private Key key;

    @PostConstruct
    public void init() {
        String sysProp = System.getProperty("security.jwt.secret");
        String envVar = System.getenv("SECURITY_JWT_SECRET");
        String secretToUse = null;

        if (sysProp != null && !sysProp.isBlank()) secretToUse = sysProp;
        else if (envVar != null && !envVar.isBlank()) secretToUse = envVar;
        else if (jwtSecretProperty != null && !jwtSecretProperty.isBlank()) secretToUse = jwtSecretProperty;

        if (secretToUse == null || secretToUse.isBlank()) {
            log.error("Missing JWT secret. Set 'security.jwt.secret' (application.properties) or env SECURITY_JWT_SECRET. Aborting startup.");
            throw new IllegalStateException("Missing security.jwt.secret");
        }

        byte[] keyBytes;
        try {
            keyBytes = Base64.getDecoder().decode(secretToUse);
        } catch (IllegalArgumentException ex) {
            keyBytes = secretToUse.getBytes(StandardCharsets.UTF_8);
        }

        try {
            key = Keys.hmacShaKeyFor(keyBytes);
        } catch (WeakKeyException ex) {
            log.error("Provided JWT secret too weak; it must be long enough (use base64-encoded 256-bit key). Aborting startup.");
            throw new IllegalStateException("security.jwt.secret too weak", ex);
        }
    }

    public String generateAccessToken(User user) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + accessExpSeconds * 1000);
        return Jwts.builder()
                .setSubject(String.valueOf(user.getId()))
                .setIssuedAt(now)
                .setExpiration(exp)
                .claim("email", user.getEmail())
                .claim("fullName", user.getFullName())
                .claim("role", normalizeRole(user.getRole()))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    public String getSubject(String token) {
        Claims c = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
        return c.getSubject();
    }

    public String generateRefreshTokenValue() {
        return UUID.randomUUID().toString();
    }

    public long getAccessExpiresInSeconds() {
        return accessExpSeconds;
    }

    public String getRole(String token) {
        Claims c = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
        Object role = c.get("role");
        if (role == null) return "USER";
        return normalizeRole(String.valueOf(role));
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "USER";
        }
        String normalized = role.trim().toUpperCase();
        if (normalized.startsWith("ROLE_")) {
            normalized = normalized.substring(5);
        }
        return normalized;
    }
}