package com.social;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import io.github.cdimascio.dotenv.Dotenv;
import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@ComponentScan("com.social")
@EnableJpaRepositories(basePackages = "com.social.user.infrastructure.repositories")
@EntityScan(basePackages = "com.social.user.domain.entities")
public class SocialNetworkApplication {

    public static void main(String[] args) {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));

        SpringApplication app = new SpringApplication(SocialNetworkApplication.class);

        String active = System.getProperty("spring.profiles.active");
        if (active == null || active.isBlank()) {
            Map<String, Object> def = new HashMap<>();
            def.put("spring.profiles.active", "auth");
            app.setDefaultProperties(def);
        }

        app.run(args);
    }
}