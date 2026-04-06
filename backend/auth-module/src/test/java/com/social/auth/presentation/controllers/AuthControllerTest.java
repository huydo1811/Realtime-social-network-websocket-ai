package com.social.auth.presentation.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.util.Collections;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.social.auth.application.usecases.AuthenticateUseCase;
import com.social.auth.application.usecases.LogoutUseCase;
import com.social.auth.application.usecases.RefreshTokenUseCase;
import com.social.auth.application.usecases.RegisterUseCase;
import com.social.auth.presentation.dto.AuthResponseDto;
import com.social.auth.presentation.dto.ProfileDto;
import com.social.auth.presentation.dto.RegisterDto;
import com.social.auth.presentation.dto.RefreshRequestDto;
import com.social.auth.presentation.mapper.AuthMapper;
import com.social.auth.infrastructure.security.JwtService;
import com.social.user.application.usecases.ChangePasswordUseCase;
import com.social.user.domain.entities.User;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private RegisterUseCase registerUseCase;

    @MockBean
    private AuthenticateUseCase authenticateUseCase;

    @MockBean
    private RefreshTokenUseCase refreshTokenUseCase;

    @MockBean
    private LogoutUseCase logoutUseCase;

    @MockBean
    private AuthMapper authMapper;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private ChangePasswordUseCase changePasswordUseCase;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void post_register_returns_profile_with_body() throws Exception {
        RegisterDto dto = new RegisterDto();
        dto.setEmail("a@x.com");
        dto.setPhone("0123456");
        dto.setPassword("123456");
        dto.setFullName("Full Name");

        Timestamp now = new Timestamp(System.currentTimeMillis());
        User u = new User(1L, "a@x.com", "0123456", "pwhash", "Full Name", null, null, null, "USER", true, now, now);

        ProfileDto profile = new ProfileDto();
        profile.setEmail("a@x.com");
        profile.setFullName("Full Name");

        when(registerUseCase.execute(any(RegisterDto.class))).thenReturn(u);
        when(authMapper.toProfileDto(u)).thenReturn(profile);

        mvc.perform(post("/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("a@x.com"))
            .andExpect(jsonPath("$.fullName").value("Full Name"));
    }

    @Test
    void post_register_validation_fail_phone_too_short() throws Exception {
        RegisterDto dto = new RegisterDto();
        dto.setEmail("a@x.com");
        dto.setPhone("123");
        dto.setPassword("123456");
        dto.setFullName("Full");

        mvc.perform(post("/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void post_register_duplicate_returns_400() throws Exception {
        RegisterDto dto = new RegisterDto();
        dto.setEmail("a@x.com");
        dto.setPhone("0123456");
        dto.setPassword("123456");
        dto.setFullName("Full Name");

        when(registerUseCase.execute(any(RegisterDto.class))).thenThrow(new RuntimeException("duplicate"));

        mvc.perform(post("/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isBadRequest())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string("duplicate"));
    }

    @Test
    void post_register_server_error_returns_500() throws Exception {
        RegisterDto dto = new RegisterDto();
        dto.setEmail("a@x.com");
        dto.setPhone("0123456");
        dto.setPassword("123456");
        dto.setFullName("Full Name");

        when(registerUseCase.execute(any(RegisterDto.class))).thenAnswer(invocation -> { throw new Exception("boom"); });
        mvc.perform(post("/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isInternalServerError())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string("Đã xảy ra lỗi hệ thống"));
    }

    @Test
    void post_login_returns_tokens() throws Exception {
        com.social.auth.presentation.dto.LoginDto dto = new com.social.auth.presentation.dto.LoginDto();
        dto.setEmail("a@x.com");
        dto.setPassword("pw");

        AuthResponseDto resp = new AuthResponseDto();
        resp.setAccessToken("access-1");
        resp.setRefreshToken("refresh-1");
        resp.setExpiresIn(3600);

        when(authenticateUseCase.authenticate(any())).thenReturn(resp);

        mvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("access-1"))
            .andExpect(jsonPath("$.refreshToken").value("refresh-1"))
            .andExpect(jsonPath("$.expiresIn").value(3600));
    }

    @Test
    void post_login_invalid_credentials_returns_401() throws Exception {
        com.social.auth.presentation.dto.LoginDto dto = new com.social.auth.presentation.dto.LoginDto();
        dto.setEmail("a@x.com");
        dto.setPassword("bad");

        when(authenticateUseCase.authenticate(any())).thenThrow(new IllegalArgumentException("Invalid credentials"));

        mvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isUnauthorized())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string("Invalid credentials"));
    }

    @Test
    void post_login_validation_fail_missing_password_returns_400() throws Exception {
        String payload = "{\"email\":\"a@x.com\"}";

        mvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isBadRequest());
    }

    @Test
    void post_refresh_returns_new_tokens() throws Exception {
        RefreshRequestDto req = new RefreshRequestDto();
        req.setRefreshToken("old-refresh");

        AuthResponseDto resp = new AuthResponseDto();
        resp.setAccessToken("new-access");
        resp.setRefreshToken("new-refresh");
        resp.setExpiresIn(3600);

        when(refreshTokenUseCase.refresh(any())).thenReturn(resp);

        mvc.perform(post("/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("new-access"))
            .andExpect(jsonPath("$.refreshToken").value("new-refresh"));
    }

    @Test
    void post_refresh_invalid_token_returns_401() throws Exception {
        RefreshRequestDto req = new RefreshRequestDto();
        req.setRefreshToken("bad");

        when(refreshTokenUseCase.refresh(any())).thenThrow(new IllegalArgumentException("Invalid refresh"));

        mvc.perform(post("/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isUnauthorized())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string("Invalid refresh"));
    }

    @Test
    void post_refresh_validation_fail_missing_field_returns_400() throws Exception {
        String payload = "{}";
        mvc.perform(post("/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isBadRequest());
    }

    @Test
    void post_logout_returns_ok_and_calls_usecase() throws Exception {
        RefreshRequestDto req = new RefreshRequestDto();
        req.setRefreshToken("to-logout");

        mvc.perform(post("/auth/logout")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk());

        verify(logoutUseCase).logout("to-logout");
    }

    @Test
    void post_changePassword_success_returns200() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("1", null, Collections.emptyList())
        );

        com.social.auth.presentation.dto.ChangePasswordDto dto = new com.social.auth.presentation.dto.ChangePasswordDto();
        dto.setCurrentPassword("oldpw");
        dto.setNewPassword("newpw123");

        Timestamp now = new Timestamp(System.currentTimeMillis());
        User u = new User(1L, "a@x.com", "0123", "hash", "Name", null, null, null, "USER", true, now, now);
        when(changePasswordUseCase.execute(eq(1L), anyString(), anyString())).thenReturn(u);

        mvc.perform(post("/auth/change-password")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isOk())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string("Đổi mật khẩu thành công"));

        SecurityContextHolder.clearContext();
    }

    @Test
    void post_changePassword_wrong_current_returns400() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("1", null, Collections.emptyList())
        );

        com.social.auth.presentation.dto.ChangePasswordDto dto = new com.social.auth.presentation.dto.ChangePasswordDto();
        dto.setCurrentPassword("bad");
        dto.setNewPassword("newpw123");

        when(changePasswordUseCase.execute(eq(1L), anyString(), anyString()))
            .thenThrow(new IllegalArgumentException("Mật khẩu hiện tại không đúng"));

        mvc.perform(post("/auth/change-password")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isBadRequest())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string("Mật khẩu hiện tại không đúng"));

        SecurityContextHolder.clearContext();
    }

    @Test
    void post_changePassword_validation_fail_newPassword_too_short_returns400() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("1", null, Collections.emptyList())
        );

        com.social.auth.presentation.dto.ChangePasswordDto dto = new com.social.auth.presentation.dto.ChangePasswordDto();
        dto.setCurrentPassword("oldpw");
        dto.setNewPassword("123");

        mvc.perform(post("/auth/change-password")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isBadRequest());

        SecurityContextHolder.clearContext();
    }

    @Test
    void post_changePassword_service_error_returns500() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("1", null, Collections.emptyList())
        );

        com.social.auth.presentation.dto.ChangePasswordDto dto = new com.social.auth.presentation.dto.ChangePasswordDto();
        dto.setCurrentPassword("oldpw");
        dto.setNewPassword("newpw123");

        when(changePasswordUseCase.execute(eq(1L), anyString(), anyString())).thenAnswer(inv -> { throw new Exception("boom"); });

        mvc.perform(post("/auth/change-password")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isInternalServerError())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string("Đã xảy ra lỗi hệ thống"));

        SecurityContextHolder.clearContext();
    }

    @Test
    void post_changePassword_user_not_found_returns404() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("99", null, Collections.emptyList())
        );

        com.social.auth.presentation.dto.ChangePasswordDto dto = new com.social.auth.presentation.dto.ChangePasswordDto();
        dto.setCurrentPassword("oldpw");
        dto.setNewPassword("newpw123");

        when(changePasswordUseCase.execute(eq(99L), anyString(), anyString()))
            .thenThrow(new RuntimeException("Người dùng không tồn tại"));

        mvc.perform(post("/auth/change-password")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isNotFound())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string("Người dùng không tồn tại"));

        SecurityContextHolder.clearContext();
    }

    @Test
    void post_changePassword_no_auth_returns401() throws Exception {
        SecurityContextHolder.clearContext();

        com.social.auth.presentation.dto.ChangePasswordDto dto = new com.social.auth.presentation.dto.ChangePasswordDto();
        dto.setCurrentPassword("oldpw");
        dto.setNewPassword("newpw123");

        mvc.perform(post("/auth/change-password")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isUnauthorized())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string("Unauthorized"));
    }
}