package com.social;

import io.github.cdimascio.dotenv.Dotenv;

public class SocialNetworkApplication {
    public static void main(String[] args) {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
        org.springframework.boot.SpringApplication.run(SocialNetworkApplication.class, args);
    }
}
