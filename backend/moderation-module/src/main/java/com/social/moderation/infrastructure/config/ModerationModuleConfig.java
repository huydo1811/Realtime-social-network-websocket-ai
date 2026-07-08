package com.social.moderation.infrastructure.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Enables the {@link ModerationProperties} so {@code @ConfigurationProperties}
 * binding works when this module is on the classpath. Component scanning
 * of the {@code com.social} root already picks up services and entities
 * defined here.
 */
@Configuration
@EnableConfigurationProperties(ModerationProperties.class)
public class ModerationModuleConfig {
}