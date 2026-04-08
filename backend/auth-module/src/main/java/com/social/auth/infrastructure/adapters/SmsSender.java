package com.social.auth.infrastructure.adapters;

public interface SmsSender { 
    void send(String to, String body); 
}