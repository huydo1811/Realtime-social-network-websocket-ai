package com.social.auth.infrastructure.security;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.security.web.servlet.util.matcher.MvcRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.handler.HandlerMappingIntrospector;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;

  @Value("${app.cors.allowed-origins:http://localhost:3000}")
  private String allowedOrigins;

  public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http, HandlerMappingIntrospector introspector) throws Exception {
    MvcRequestMatcher.Builder mvc = new MvcRequestMatcher.Builder(introspector);

    http
      .csrf(csrf -> csrf.disable())
      .cors(cors -> cors.configurationSource(corsConfigurationSource()))
      .authorizeHttpRequests(auth -> auth
        .requestMatchers(
          mvc.pattern("/auth/register"),
          mvc.pattern("/auth/login"),
          mvc.pattern("/auth/refresh"),
          mvc.pattern("/auth/request-otp"),
          mvc.pattern("/auth/verify-otp"),
          mvc.pattern("/auth/reset-password"),
          mvc.pattern(HttpMethod.GET, "/auth/check-admin"), // Bao lại bằng mvc.pattern cho chuẩn xác
          mvc.pattern("/ws/**") // Cho phép kết nối WebSocket
        ).permitAll()
        .requestMatchers("/auth/logout", "/auth/change-password").authenticated()
        .requestMatchers(mvc.pattern(HttpMethod.GET, "/users/me")).authenticated()
        .requestMatchers(mvc.pattern(HttpMethod.PUT, "/users/me")).authenticated()
        .requestMatchers(mvc.pattern("/friendships/**")).authenticated()
        .requestMatchers(mvc.pattern("/posts/**")).authenticated()
        .requestMatchers(mvc.pattern("/pets/**")).authenticated()
        .requestMatchers(mvc.pattern(HttpMethod.POST, "/users")).hasRole("ADMIN")
        .requestMatchers(mvc.pattern(HttpMethod.PUT, "/users/{id}")).hasRole("ADMIN")
        .requestMatchers(mvc.pattern(HttpMethod.DELETE, "/users/{id}")).hasRole("ADMIN")
        .requestMatchers(mvc.pattern(HttpMethod.GET, "/users")).hasAnyRole("USER", "ADMIN")
        .requestMatchers(mvc.pattern(HttpMethod.GET, "/users/{id}")).hasAnyRole("USER", "ADMIN")
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        .anyRequest().authenticated()
      )
      .httpBasic(httpBasic -> httpBasic.disable())
      .formLogin(form -> form.disable());

    http.addFilterBefore(jwtAuthenticationFilter, AnonymousAuthenticationFilter.class);
    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOriginPatterns(List.of("*"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(
        List.of("Authorization", "Content-Type", "X-Admin-Chat-Reason"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}