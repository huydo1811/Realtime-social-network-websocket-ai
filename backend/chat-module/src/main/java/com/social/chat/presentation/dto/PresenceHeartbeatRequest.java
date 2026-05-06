package com.social.chat.presentation.dto;

public class PresenceHeartbeatRequest {
    private boolean online = true;

    public boolean isOnline() {
        return online;
    }

    public void setOnline(boolean online) {
        this.online = online;
    }
}
