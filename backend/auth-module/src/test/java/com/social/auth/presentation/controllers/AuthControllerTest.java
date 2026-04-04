package com.social.auth.presentation.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.social.auth.application.usecases.AuthenticateUseCase;
import com.social.auth.application.usecases.LogoutUseCase;
import com.social.auth.application.usecases.RefreshTokenUseCase;
import com.social.auth.application.usecases.RegisterUseCase;
import com.social.auth.infrastructure.security.JwtService;
import com.social.auth.presentation.dto.ProfileDto;
import com.social.auth.presentation.dto.RegisterDto;
import com.social.auth.presentation.mapper.AuthMapper;
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

    private final ObjectMapper objectMapper = new ObjectMapper();

    //Gửi yêu cầu đăng ký với dữ liệu hợp lệ, nó sẽ trả về profile của user mới tạo với mã trạng thái 200 OK
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

    //Gửi yêu cầu đăng ký với số điện thoại quá ngắn, nó sẽ trả về mã trạng thái 400 Bad Request
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

    //Gửi yêu cầu đăng ký với email đã tồn tại, nó sẽ trả về mã trạng thái 400 Bad Request và nội dung lỗi "duplicate"
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

    //Gửi yêu cầu đăng ký với lỗi máy chủ, nó sẽ trả về mã trạng thái 500 Internal Server Error
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
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string("Đã xảy ra lỗi hệ thống"));    }

    //Gửi yêu cầu đăng nhập với email và mật khẩu hợp lệ, nó sẽ trả về access token và refresh token mới với mã trạng thái 200 OK
    @Test
    void post_login_returns_tokens() throws Exception {
        com.social.auth.presentation.dto.LoginDto dto = new com.social.auth.presentation.dto.LoginDto();
        dto.setEmail("a@x.com");
        dto.setPassword("pw");

        com.social.auth.presentation.dto.AuthResponseDto resp = new com.social.auth.presentation.dto.AuthResponseDto();
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

    //Gửi yêu cầu đăng nhập với email tồn tại nhưng mật khẩu sai, nó sẽ trả về mã trạng thái 401 Unauthorized và nội dung lỗi "Invalid credentials"
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

    //Gửi yêu cầu đăng nhập với dữ liệu không hợp lệ (thiếu mật khẩu), nó sẽ trả về mã trạng thái 400 Bad Request
    @Test
    void post_login_validation_fail_missing_password_returns_400() throws Exception {
        // send JSON with missing password
        String payload = "{\"email\":\"a@x.com\"}";

        mvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isBadRequest());
    }

    //Gửi yêu cầu refresh token với refresh token hợp lệ, nó sẽ trả về access token mới và refresh token mới với mã trạng thái 200 OK, đồng thời verify rằng refreshTokenUseCase.refresh được gọi với đúng tham số
    @Test
    void post_refresh_returns_new_tokens() throws Exception {
        com.social.auth.presentation.dto.RefreshRequestDto req = new com.social.auth.presentation.dto.RefreshRequestDto();
        req.setRefreshToken("old-refresh");

        com.social.auth.presentation.dto.AuthResponseDto resp = new com.social.auth.presentation.dto.AuthResponseDto();
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

    //Gửi yêu cầu refresh token với refresh token không tồn tại, nó sẽ trả về mã trạng thái 401 Unauthorized và nội dung lỗi "Invalid refresh"
    @Test
    void post_refresh_invalid_token_returns_401() throws Exception {
        com.social.auth.presentation.dto.RefreshRequestDto req = new com.social.auth.presentation.dto.RefreshRequestDto();
        req.setRefreshToken("bad");

        when(refreshTokenUseCase.refresh(any())).thenThrow(new IllegalArgumentException("Invalid refresh"));

        mvc.perform(post("/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isUnauthorized())
            .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string("Invalid refresh"));
    }

    //Gửi yêu cầu refresh token với dữ liệu không hợp lệ (thiếu trường), nó sẽ trả về mã trạng thái 400 Bad Request
    @Test
    void post_refresh_validation_fail_missing_field_returns_400() throws Exception {
        String payload = "{}";
        mvc.perform(post("/auth/refresh")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
            .andExpect(status().isBadRequest());
    }

    //Gửi yêu cầu đăng xuất với refresh token hợp lệ, nó sẽ trả về mã trạng thái 200 OK và verify rằng logoutUseCase.logout được gọi với đúng tham số
    @Test
    void post_logout_returns_ok_and_calls_usecase() throws Exception {
        com.social.auth.presentation.dto.RefreshRequestDto req = new com.social.auth.presentation.dto.RefreshRequestDto();
        req.setRefreshToken("to-logout");

        mvc.perform(post("/auth/logout")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk());

        verify(logoutUseCase).logout("to-logout");
    }
}