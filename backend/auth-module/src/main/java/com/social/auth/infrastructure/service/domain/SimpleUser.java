package com.social.auth.infrastructure.service.domain;

public class SimpleUser {
    private Long id;
    private String email;
    private String phone;
    public SimpleUser(Long id){ this.id = id; }
    public Long getId(){ return id; }
    public void setId(Long id){ this.id = id; }
}