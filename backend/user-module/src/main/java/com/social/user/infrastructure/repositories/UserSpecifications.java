package com.social.user.infrastructure.repositories;

import org.springframework.data.jpa.domain.Specification;

import com.social.user.domain.entities.User;

public final class UserSpecifications {
    private UserSpecifications() {}

    public static Specification<User> hasEmailLike(String email) {
        return (root, query, cb) -> {
            if (email == null || email.isBlank()) return cb.conjunction();
            return cb.like(cb.lower(root.get("email")), "%" + email.toLowerCase() + "%");
        };
    }

    public static Specification<User> hasFullNameLike(String fullName) {
        return (root, query, cb) -> {
            if (fullName == null || fullName.isBlank()) return cb.conjunction();
            return cb.like(cb.lower(root.get("fullName")), "%" + fullName.toLowerCase() + "%");
        };
    }

    public static Specification<User> hasUsernameLike(String username) {
        return (root, query, cb) -> {
            if (username == null || username.isBlank()) return cb.conjunction();
            return cb.like(cb.lower(root.get("username")), "%" + username.toLowerCase() + "%");
        };
    }

    /** Tim theo email HOAC fullName HOAC username */
    public static Specification<User> matchesQuery(String q) {
        return (root, query, cb) -> {
            if (q == null || q.isBlank()) return cb.conjunction();
            String pattern = "%" + q.toLowerCase().trim() + "%";
            return cb.or(
                    cb.like(cb.lower(cb.coalesce(root.get("email"), "")), pattern),
                    cb.like(cb.lower(cb.coalesce(root.get("fullName"), "")), pattern),
                    cb.like(cb.lower(cb.coalesce(root.get("username"), "")), pattern)
            );
        };
    }

    public static Specification<User> hasIsActive(Boolean isActive) {
        return (root, query, cb) -> {
            if (isActive == null) return cb.conjunction();
            return cb.equal(root.get("isActive"), isActive);
        };
    }
}
