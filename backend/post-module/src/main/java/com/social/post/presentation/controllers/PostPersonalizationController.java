package com.social.post.presentation.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.social.post.application.usecases.HidePostForUserUseCase;

@RestController
@RequestMapping("/posts")
public class PostPersonalizationController {
    private final HidePostForUserUseCase hidePostForUserUseCase;

    public PostPersonalizationController(HidePostForUserUseCase hidePostForUserUseCase) {
        this.hidePostForUserUseCase = hidePostForUserUseCase;
    }

    @PostMapping("/{postId}/hide-for-me")
    public ResponseEntity<Void> hideForMe(@PathVariable Long postId) {
        hidePostForUserUseCase.execute(currentUserId(), postId);
        return ResponseEntity.noContent().build();
    }

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new IllegalArgumentException("Vui lòng đăng nhập để thực hiện thao tác này");
        }
        try {
            return Long.parseLong(String.valueOf(auth.getPrincipal()));
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Token không hợp lệ");
        }
    }
}
