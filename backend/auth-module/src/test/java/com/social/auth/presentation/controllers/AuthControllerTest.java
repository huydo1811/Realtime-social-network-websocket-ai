package com.social.auth.presentation.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import java.sql.Timestamp;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.social.auth.application.usecases.RegisterUseCase;
import com.social.auth.presentation.dto.ProfileDto;
import com.social.auth.presentation.dto.RegisterDto;
import com.social.auth.presentation.mapper.AuthMapper;
import com.social.user.domain.entities.User;

@ExtendWith(SpringExtension.class)
@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private RegisterUseCase registerUseCase;

    @MockBean
    private AuthMapper authMapper;

    private ObjectMapper objectMapper = new ObjectMapper();


    //Khi post /auth/register với body hợp lệ, nó sẽ gọi registerUseCase.execute với đúng tham số, và trả về profile của user đã tạo
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

    //Khi post /auth/register với phone quá ngắn, nó sẽ trả về lỗi 400 Bad Request
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

    //Khi post /auth/register với password quá ngắn, nó sẽ trả về lỗi 400 Bad Request
    @Test
    void post_register_validation_fail_password_too_short() throws Exception {
        RegisterDto dto = new RegisterDto();
        dto.setEmail("a@x.com");
        dto.setPhone("0123456");
        dto.setPassword("123");
        dto.setFullName("Full");

        mvc.perform(post("/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isBadRequest());
    }
}