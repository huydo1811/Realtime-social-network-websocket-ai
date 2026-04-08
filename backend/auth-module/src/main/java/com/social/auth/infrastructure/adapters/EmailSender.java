package com.social.auth.infrastructure.adapters;

public interface EmailSender { 
    void send(String to, String subject, String body); 
}