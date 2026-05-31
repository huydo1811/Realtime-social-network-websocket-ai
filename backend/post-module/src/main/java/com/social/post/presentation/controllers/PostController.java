package com.social.post.presentation.controllers;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.social.post.application.usecases.AdminHidePostUseCase;
import com.social.post.application.usecases.CreatePostUseCase;
import com.social.post.application.usecases.DeletePostUseCase;
import com.social.post.application.usecases.GetPostByIdUseCase;
import com.social.post.application.usecases.ListFeedPostsUseCase;
import com.social.post.application.usecases.ListUserPostsUseCase;
import com.social.post.application.usecases.UpdatePostUseCase;
import com.social.post.presentation.dto.CreatePostRequest;
import com.social.post.presentation.dto.PostResponse;
import com.social.post.presentation.dto.UpdatePostRequest;
import com.social.post.presentation.mapper.PostMapper;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/posts")
public class PostController {
    private final CreatePostUseCase createPostUseCase;
    private final UpdatePostUseCase updatePostUseCase;
    private final DeletePostUseCase deletePostUseCase;
    private final GetPostByIdUseCase getPostByIdUseCase;
    private final ListUserPostsUseCase listUserPostsUseCase;
    private final ListFeedPostsUseCase listFeedPostsUseCase;
    private final AdminHidePostUseCase adminHidePostUseCase;
    private final PostMapper postMapper;

    public PostController(
            CreatePostUseCase createPostUseCase,
            UpdatePostUseCase updatePostUseCase,
            DeletePostUseCase deletePostUseCase,
            GetPostByIdUseCase getPostByIdUseCase,
            ListUserPostsUseCase listUserPostsUseCase,
            ListFeedPostsUseCase listFeedPostsUseCase,
            AdminHidePostUseCase adminHidePostUseCase,
            PostMapper postMapper) {
        this.createPostUseCase = createPostUseCase;
        this.updatePostUseCase = updatePostUseCase;
        this.deletePostUseCase = deletePostUseCase;
        this.getPostByIdUseCase = getPostByIdUseCase;
        this.listUserPostsUseCase = listUserPostsUseCase;
        this.listFeedPostsUseCase = listFeedPostsUseCase;
        this.adminHidePostUseCase = adminHidePostUseCase;
        this.postMapper = postMapper;
    }

    @PostMapping
    public ResponseEntity<PostResponse> createPost(@Valid @RequestBody CreatePostRequest request) {
        Long actorId = currentUserId();
        var post = createPostUseCase.execute(actorId, request.getContent(), request.getMediaUrl(), request.getVisibility());
        return ResponseEntity.ok(postMapper.toResponse(post));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable Long postId,
            @Valid @RequestBody UpdatePostRequest request) {
        Long actorId = currentUserId();
        var post = updatePostUseCase.execute(actorId, postId, request.getContent(), request.getMediaUrl(), request.getVisibility());
        return ResponseEntity.ok(postMapper.toResponse(post));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(@PathVariable Long postId) {
        Long actorId = currentUserId();
        deletePostUseCase.execute(actorId, postId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{postId}")
    public ResponseEntity<PostResponse> getPostById(@PathVariable Long postId) {
        Long actorId = currentUserId();
        var post = getPostByIdUseCase.execute(actorId, postId);
        return ResponseEntity.ok(postMapper.toResponse(post));
    }

    @GetMapping("/feed")
    public ResponseEntity<Page<PostResponse>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long actorId = currentUserId();
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        Page<PostResponse> response = listFeedPostsUseCase.execute(actorId, pageable).map(postMapper::toResponse);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<Page<PostResponse>> listUserPosts(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long actorId = currentUserId();
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        Page<PostResponse> response = listUserPostsUseCase.execute(actorId, userId, pageable).map(postMapper::toResponse);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/{postId}/hide")
    public ResponseEntity<PostResponse> adminHidePost(@PathVariable Long postId) {
        var post = adminHidePostUseCase.execute(postId);
        return ResponseEntity.ok(postMapper.toResponse(post));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("module", "post-module", "status", "ok"));
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
