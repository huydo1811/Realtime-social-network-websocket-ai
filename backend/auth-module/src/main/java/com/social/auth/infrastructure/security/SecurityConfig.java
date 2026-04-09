package com.social.auth.infrastructure.security;

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
import org.springframework.web.servlet.handler.HandlerMappingIntrospector;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, HandlerMappingIntrospector introspector) throws Exception {
        MvcRequestMatcher.Builder mvc = new MvcRequestMatcher.Builder(introspector);

        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/auth/register",
                    "/auth/login",
                    "/auth/refresh",
                    "/auth/request-otp",
                    "/auth/verify-otp"
                ).permitAll()

                .requestMatchers("/auth/logout", "/auth/change-password").authenticated()

                .requestMatchers(mvc.pattern(HttpMethod.GET, "/users/me")).authenticated()
                .requestMatchers(mvc.pattern(HttpMethod.PUT, "/users/me")).authenticated()

                .requestMatchers(mvc.pattern(HttpMethod.POST, "/users")).hasRole("ADMIN")
                .requestMatchers(mvc.pattern(HttpMethod.PUT, "/users/{id}")).hasRole("ADMIN")
                .requestMatchers(mvc.pattern(HttpMethod.DELETE, "/users/{id}")).hasRole("ADMIN")

                .requestMatchers(mvc.pattern(HttpMethod.GET, "/users")).hasAnyRole("USER", "ADMIN")
                .requestMatchers(mvc.pattern(HttpMethod.GET, "/users/{id}")).hasAnyRole("USER", "ADMIN")

                .anyRequest().authenticated()
            )
            .httpBasic(httpBasic -> httpBasic.disable())
            .formLogin(form -> form.disable());

        http.addFilterBefore(jwtAuthenticationFilter, AnonymousAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}