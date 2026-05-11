package com.social.call.application.ratelimit;

import java.time.Duration;
import java.util.Objects;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class CallRateLimiter {

    private static final Duration WINDOW = Duration.ofSeconds(10);
    private static final int MAX_REQUESTS = 40;
    private final StringRedisTemplate redisTemplate;

    public CallRateLimiter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean allow(Long userId, String eventType) {
        if (userId == null || eventType == null) {
            return false;
        }
        String key = "call:ratelimit:%d:%s".formatted(userId, eventType);
        Long count = redisTemplate.opsForValue().increment(key);
        if (Objects.equals(count, 1L)) {
            redisTemplate.expire(key, WINDOW);
        }
        return count != null && count <= MAX_REQUESTS;
    }
}
