package com.social.auth.integration;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.social.auth.presentation.dto.RegisterDto;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@TestPropertySource(properties = {
  "jakarta.persistence.jdbc.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1",
  "jakarta.persistence.jdbc.driver=org.h2.Driver",
  "spring.jpa.hibernate.ddl-auto=create-drop",
  "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
  "security.jwt.secret=REPLACE_WITH_STRONG_BASE64_SECRET"
})
class RegisterIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UserRepository userRepository;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void clean() {
        userRepository.findByEmail("e2e@x.com").ifPresent(u -> userRepository.deleteById(u.getId()));
        userRepository.findByPhone("0999999").ifPresent(u -> userRepository.deleteById(u.getId()));
    }

    //Khi post /auth/register với body hợp lệ, nó sẽ trả về profile của user đã tạo, và user đó được lưu vào database
    @Test
    void register_persists_user_into_db() throws Exception {
        RegisterDto dto = new RegisterDto();
        dto.setEmail("e2e@x.com");
        dto.setPhone("0999999");
        dto.setPassword("secret123");
        dto.setFullName("E2E User");

        mvc.perform(post("/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(dto)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("e2e@x.com"));

        Optional<User> saved = userRepository.findByEmail("e2e@x.com");
        assertTrue(saved.isPresent());
        assertEquals("E2E User", saved.get().getFullName());
    }
}