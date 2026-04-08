package com.social.auth.infrastructure.adapters;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class DevLogSmsSender implements SmsSender {
    private static final Logger log = LoggerFactory.getLogger(DevLogSmsSender.class);
    @Override public void send(String to, String body) {
        log.info("DEV-SMS -> to={} body={}", to, body);
    }
}