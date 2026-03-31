package com.social.user.e2e;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.social.user.presentation.dto.CreateUserDto;
import com.social.user.presentation.dto.UserViewDto;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class UserFlowIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void registerPgProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "update");
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createUser_then_getById_returnsCreatedUser() throws Exception {
        CreateUserDto req = new CreateUserDto();
        req.setEmail("flow@example.com");
        req.setPhone("0920000001");
        req.setPassword("strongpassword");
        req.setFullName("Flow User");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String body = objectMapper.writeValueAsString(req);

        ResponseEntity<UserViewDto> postResp = rest.postForEntity(
            "http://localhost:" + port + "/users",
            new HttpEntity<>(body, headers),
            UserViewDto.class
        );

        assertThat(postResp.getStatusCode().is2xxSuccessful()).isTrue();
        UserViewDto created = postResp.getBody();
        assertThat(created).isNotNull();
        assertThat(created.getEmail()).isEqualTo("flow@example.com");
        Long id = created.getId();

        ResponseEntity<UserViewDto> getResp = rest.getForEntity(
            "http://localhost:" + port + "/users/" + id,
            UserViewDto.class
        );

        assertThat(getResp.getStatusCode().is2xxSuccessful()).isTrue();
        UserViewDto fetched = getResp.getBody();
        assertThat(fetched).isNotNull();
        assertThat(fetched.getEmail()).isEqualTo("flow@example.com");
    }
}