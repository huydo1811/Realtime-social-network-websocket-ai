package com.social.call.infrastructure.websocket;

import java.security.Principal;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.social.call.infrastructure.services.CallStateManager;

@Component
public class CallSessionEventListener {

    private final CallStateManager callStateManager;

    public CallSessionEventListener(CallStateManager callStateManager) {
        this.callStateManager = callStateManager;
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal user = accessor.getUser();
        if ((user == null || user.getName() == null) && accessor.getSessionAttributes() != null) {
            Object stored = accessor.getSessionAttributes().get(CallWebSocketAuthChannelInterceptor.SESSION_STOMP_PRINCIPAL);
            if (stored instanceof Principal p) {
                user = p;
            }
        }
        if (user == null || user.getName() == null) {
            return;
        }
        try {
            Long userId = Long.parseLong(user.getName());
            callStateManager.unregisterUserSession(userId, accessor.getSessionId());
        } catch (NumberFormatException ignored) {
            // Ignore invalid principal values on disconnect.
        }
    }
}
