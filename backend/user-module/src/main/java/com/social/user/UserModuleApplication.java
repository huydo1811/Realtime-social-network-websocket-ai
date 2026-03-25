package com.social.user;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
public class UserModuleApplication {
    public static void main(String[] args) {
        Dotenv.configure().ignoreIfMissing().load(); 
        SpringApplication.run(UserModuleApplication.class, args);
    }
}