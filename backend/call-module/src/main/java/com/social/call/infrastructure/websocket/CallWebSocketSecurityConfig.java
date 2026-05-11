package com.social.call.infrastructure.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
public class CallWebSocketSecurityConfig implements WebSocketMessageBrokerConfigurer {

    private final CallWebSocketAuthChannelInterceptor authChannelInterceptor;

    public CallWebSocketSecurityConfig(CallWebSocketAuthChannelInterceptor authChannelInterceptor) {
        this.authChannelInterceptor = authChannelInterceptor;
    }

    @Override
    public void configureClientInboundChannel(@NonNull ChannelRegistration registration) {
        registration.interceptors(authChannelInterceptor);
    }
}
