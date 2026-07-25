package com.social.friendship.presentation.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.social.friendship.application.usecases.FollowUserUseCase;
import com.social.friendship.application.usecases.GetFollowStatusUseCase;
import com.social.friendship.application.usecases.ListFollowSuggestionsUseCase;
import com.social.friendship.application.usecases.ListFollowingUseCase;
import com.social.friendship.application.usecases.UnfollowUserUseCase;
import com.social.friendship.presentation.dto.FollowRequest;
import com.social.friendship.presentation.dto.FollowResponse;
import com.social.friendship.presentation.dto.FollowSuggestionResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/follows")
public class FollowController {
    private final FollowUserUseCase followUserUseCase;
    private final UnfollowUserUseCase unfollowUserUseCase;
    private final ListFollowingUseCase listFollowingUseCase;
    private final GetFollowStatusUseCase getFollowStatusUseCase;
    private final ListFollowSuggestionsUseCase listFollowSuggestionsUseCase;

    public FollowController(
            FollowUserUseCase followUserUseCase,
            UnfollowUserUseCase unfollowUserUseCase,
            ListFollowingUseCase listFollowingUseCase,
            GetFollowStatusUseCase getFollowStatusUseCase,
            ListFollowSuggestionsUseCase listFollowSuggestionsUseCase) {
        this.followUserUseCase = followUserUseCase;
        this.unfollowUserUseCase = unfollowUserUseCase;
        this.listFollowingUseCase = listFollowingUseCase;
        this.getFollowStatusUseCase = getFollowStatusUseCase;
        this.listFollowSuggestionsUseCase = listFollowSuggestionsUseCase;
    }

    @PostMapping
    public ResponseEntity<FollowResponse> follow(@Valid @RequestBody FollowRequest request) {
        Long actorId = currentUserId();
        return ResponseEntity.ok(FollowResponse.from(followUserUseCase.execute(actorId, request.getTargetUserId())));
    }

    @DeleteMapping
    public ResponseEntity<Void> unfollow(@Valid @RequestBody FollowRequest request) {
        Long actorId = currentUserId();
        unfollowUserUseCase.execute(actorId, request.getTargetUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/following")
    public ResponseEntity<List<FollowResponse>> listFollowing() {
        Long actorId = currentUserId();
        return ResponseEntity.ok(listFollowingUseCase.execute(actorId).stream().map(FollowResponse::from).toList());
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> followStatus(@RequestParam Long targetUserId) {
        Long actorId = currentUserId();
        return ResponseEntity.ok(Map.of("following", getFollowStatusUseCase.execute(actorId, targetUserId)));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<FollowSuggestionResponse>> suggestions(@RequestParam(defaultValue = "8") int limit) {
        Long actorId = currentUserId();
        return ResponseEntity.ok(listFollowSuggestionsUseCase.execute(actorId, limit).stream()
                .map(FollowSuggestionResponse::from)
                .toList());
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
