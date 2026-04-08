package com.social.auth.infrastructure.service;

import com.social.user.domain.entities.User;

public interface UserLookupService {

    User resolveOrCreateByContact(String contact, String contactType);
}