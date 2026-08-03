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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.social.post.application.usecases.AdminHidePostUseCase;
import com.social.post.application.usecases.AdminHideCommentUseCase;
import com.social.post.application.usecases.AdminUnhidePostUseCase;
import com.social.post.application.usecases.CreatePostUseCase;
import com.social.post.application.usecases.CreatePostCommentUseCase;
import com.social.post.application.usecases.CreatePostReplyUseCase;
import com.social.post.application.usecases.DeletePostUseCase;
import com.social.post.application.usecases.GetPostByIdUseCase;
import com.social.post.application.usecases.GetPostCommentLikeCountUseCase;
import com.social.post.application.usecases.GetPostCommentLikeStateUseCase;
import com.social.post.application.usecases.GetPostLikeStateUseCase;
import com.social.post.application.usecases.GetPetPostSocialSummaryUseCase;
import com.social.post.application.usecases.ListFeedPostsUseCase;
import com.social.post.application.usecases.ListPetPostsUseCase;
import com.social.post.application.usecases.ListPostCommentsUseCase;
import com.social.post.application.usecases.ListPostLikersUseCase;
import com.social.post.application.usecases.ListUserPostsUseCase;
import com.social.post.application.usecases.SharePostUseCase;
import com.social.post.application.usecases.TogglePostCommentLikeUseCase;
import com.social.post.application.usecases.TogglePostLikeUseCase;
import com.social.post.application.usecases.UpdatePostUseCase;
import com.social.post.application.usecases.UpdatePostVisibilityUseCase;
import com.social.post.presentation.dto.CreatePostRequest;
import com.social.post.presentation.dto.PostCommentRequest;
import com.social.post.presentation.dto.PostCommentResponse;
import com.social.post.presentation.dto.PostReplyRequest;
import com.social.post.presentation.dto.PostResponse;
import com.social.post.presentation.dto.PostShareRequest;
import com.social.post.presentation.dto.PetPostSocialSummaryResponse;
import com.social.post.presentation.dto.UpdatePostRequest;
import com.social.post.presentation.dto.UpdatePostVisibilityRequest;
import com.social.post.presentation.mapper.PostMapper;
import com.social.user.domain.repositories.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/posts")
public class PostController {
    private final CreatePostUseCase createPostUseCase;
    private final UpdatePostUseCase updatePostUseCase;
    private final UpdatePostVisibilityUseCase updatePostVisibilityUseCase;
    private final DeletePostUseCase deletePostUseCase;
    private final GetPostByIdUseCase getPostByIdUseCase;
    private final ListUserPostsUseCase listUserPostsUseCase;
    private final ListPetPostsUseCase listPetPostsUseCase;
    private final ListFeedPostsUseCase listFeedPostsUseCase;
    private final AdminHidePostUseCase adminHidePostUseCase;
    private final AdminHideCommentUseCase adminHideCommentUseCase;
    private final AdminUnhidePostUseCase adminUnhidePostUseCase;
    private final TogglePostLikeUseCase togglePostLikeUseCase;
    private final CreatePostCommentUseCase createPostCommentUseCase;
    private final CreatePostReplyUseCase createPostReplyUseCase;
    private final ListPostCommentsUseCase listPostCommentsUseCase;
    private final SharePostUseCase sharePostUseCase;
    private final GetPostLikeStateUseCase getPostLikeStateUseCase;
    private final ListPostLikersUseCase listPostLikersUseCase;
    private final GetPetPostSocialSummaryUseCase getPetPostSocialSummaryUseCase;
    private final TogglePostCommentLikeUseCase togglePostCommentLikeUseCase;
    private final GetPostCommentLikeStateUseCase getPostCommentLikeStateUseCase;
    private final GetPostCommentLikeCountUseCase getPostCommentLikeCountUseCase;
    private final PostMapper postMapper;
    private final UserRepository userRepository;

    public PostController(
            CreatePostUseCase createPostUseCase,
            UpdatePostUseCase updatePostUseCase,
            UpdatePostVisibilityUseCase updatePostVisibilityUseCase,
            DeletePostUseCase deletePostUseCase,
            GetPostByIdUseCase getPostByIdUseCase,
            ListUserPostsUseCase listUserPostsUseCase,
            ListPetPostsUseCase listPetPostsUseCase,
            ListFeedPostsUseCase listFeedPostsUseCase,
            AdminHidePostUseCase adminHidePostUseCase,
            AdminHideCommentUseCase adminHideCommentUseCase,
            AdminUnhidePostUseCase adminUnhidePostUseCase,
            TogglePostLikeUseCase togglePostLikeUseCase,
            CreatePostCommentUseCase createPostCommentUseCase,
            CreatePostReplyUseCase createPostReplyUseCase,
            ListPostCommentsUseCase listPostCommentsUseCase,
            SharePostUseCase sharePostUseCase,
            GetPostLikeStateUseCase getPostLikeStateUseCase,
            ListPostLikersUseCase listPostLikersUseCase,
            GetPetPostSocialSummaryUseCase getPetPostSocialSummaryUseCase,
            TogglePostCommentLikeUseCase togglePostCommentLikeUseCase,
            GetPostCommentLikeStateUseCase getPostCommentLikeStateUseCase,
            GetPostCommentLikeCountUseCase getPostCommentLikeCountUseCase,
            PostMapper postMapper,
            UserRepository userRepository) {
        this.createPostUseCase = createPostUseCase;
        this.updatePostUseCase = updatePostUseCase;
        this.updatePostVisibilityUseCase = updatePostVisibilityUseCase;
        this.deletePostUseCase = deletePostUseCase;
        this.getPostByIdUseCase = getPostByIdUseCase;
        this.listUserPostsUseCase = listUserPostsUseCase;
        this.listPetPostsUseCase = listPetPostsUseCase;
        this.listFeedPostsUseCase = listFeedPostsUseCase;
        this.adminHidePostUseCase = adminHidePostUseCase;
        this.adminHideCommentUseCase = adminHideCommentUseCase;
        this.adminUnhidePostUseCase = adminUnhidePostUseCase;
        this.togglePostLikeUseCase = togglePostLikeUseCase;
        this.createPostCommentUseCase = createPostCommentUseCase;
        this.createPostReplyUseCase = createPostReplyUseCase;
        this.listPostCommentsUseCase = listPostCommentsUseCase;
        this.sharePostUseCase = sharePostUseCase;
        this.getPostLikeStateUseCase = getPostLikeStateUseCase;
        this.listPostLikersUseCase = listPostLikersUseCase;
        this.getPetPostSocialSummaryUseCase = getPetPostSocialSummaryUseCase;
        this.togglePostCommentLikeUseCase = togglePostCommentLikeUseCase;
        this.getPostCommentLikeStateUseCase = getPostCommentLikeStateUseCase;
        this.getPostCommentLikeCountUseCase = getPostCommentLikeCountUseCase;
        this.postMapper = postMapper;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<PostResponse> createPost(@Valid @RequestBody CreatePostRequest request) {
        Long actorId = currentUserId();
        var post = createPostUseCase.execute(
                actorId,
                request.getContent(),
                request.getMediaUrl(),
                request.getVisibility(),
                request.getPetId());
        return ResponseEntity.ok(postMapper.toResponse(post));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<PostResponse> updatePost(
            @PathVariable Long postId,
            @Valid @RequestBody UpdatePostRequest request) {
        Long actorId = currentUserId();
        var post = updatePostUseCase.execute(
                actorId,
                postId,
                request.getContent(),
                request.getMediaUrl(),
                request.getVisibility(),
                request.getPetId());
        return ResponseEntity.ok(postMapper.toResponse(post));
    }

    @PatchMapping("/{postId}/visibility")
    public ResponseEntity<PostResponse> updatePostVisibility(
            @PathVariable Long postId,
            @Valid @RequestBody UpdatePostVisibilityRequest request) {
        Long actorId = currentUserId();
        var post = updatePostVisibilityUseCase.execute(actorId, postId, request.getVisibility());
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

    @GetMapping("/pet/{petId}")
    public ResponseEntity<Page<PostResponse>> listPetPosts(
            @PathVariable Long petId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long actorId = currentUserId();
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        Page<PostResponse> response = listPetPostsUseCase.execute(actorId, petId, pageable).map(postMapper::toResponse);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pet/{petId}/social-summary")
    public ResponseEntity<PetPostSocialSummaryResponse> getPetSocialSummary(@PathVariable Long petId) {
        Long actorId = currentUserId();
        return ResponseEntity.ok(getPetPostSocialSummaryUseCase.execute(actorId, petId));
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

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/comments/{commentId}/hide")
    public ResponseEntity<PostCommentResponse> adminHideComment(@PathVariable Long commentId) {
        var comment = adminHideCommentUseCase.execute(commentId);
        PostCommentResponse response = new PostCommentResponse();
        response.setId(comment.getId());
        response.setPostId(comment.getPostId());
        response.setUserId(comment.getUserId());
        response.setParentCommentId(comment.getParentCommentId());
        response.setContent(comment.getContent());
        userRepository.findById(comment.getUserId()).ifPresent(user -> {
            response.setAuthorName(user.getFullName());
            response.setAuthorAvatarUrl(user.getAvatarUrl());
        });
        response.setLikeCount(0);
        response.setLikedByMe(false);
        response.setCreatedAt(comment.getCreatedAt());
        response.setUpdatedAt(comment.getUpdatedAt());
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/{postId}/unhide")
    public ResponseEntity<PostResponse> adminUnhidePost(@PathVariable Long postId) {
        var post = adminUnhidePostUseCase.execute(postId);
        return ResponseEntity.ok(postMapper.toResponse(post));
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<Map<String, Long>> toggleLike(@PathVariable Long postId) {
        Long actorId = currentUserId();
        long likeCount = togglePostLikeUseCase.execute(actorId, postId);
        return ResponseEntity.ok(Map.of("likeCount", likeCount));
    }

    @GetMapping("/{postId}/like")
    public ResponseEntity<Map<String, Boolean>> getLikeState(@PathVariable Long postId) {
        Long actorId = currentUserId();
        boolean liked = getPostLikeStateUseCase.execute(actorId, postId);
        return ResponseEntity.ok(Map.of("liked", liked));
    }

    @GetMapping("/{postId}/likes")
    public ResponseEntity<java.util.List<Map<String, Object>>> listLikers(@PathVariable Long postId) {
        currentUserId();
        var likes = listPostLikersUseCase.execute(postId);
        java.util.List<Map<String, Object>> rows = likes.stream().map(like -> {
            Map<String, Object> row = new java.util.HashMap<>();
            row.put("userId", like.getUserId());
            row.put("likedAt", like.getCreatedAt());
            userRepository.findById(like.getUserId()).ifPresentOrElse(user -> {
                row.put("fullName", user.getFullName());
                row.put("username", user.getUsername());
                row.put("avatarUrl", user.getAvatarUrl());
            }, () -> {
                row.put("fullName", "Người dùng #" + like.getUserId());
                row.put("username", null);
                row.put("avatarUrl", null);
            });
            return row;
        }).toList();
        return ResponseEntity.ok(rows);
    }

    @PostMapping("/{postId}/comments")
    public ResponseEntity<PostCommentResponse> createComment(
            @PathVariable Long postId,
            @Valid @RequestBody PostCommentRequest request) {
        Long actorId = currentUserId();
        var comment = createPostCommentUseCase.execute(actorId, postId, request.getContent());
        PostCommentResponse response = new PostCommentResponse();
        response.setId(comment.getId());
        response.setPostId(comment.getPostId());
        response.setUserId(comment.getUserId());
        response.setParentCommentId(comment.getParentCommentId());
        response.setContent(comment.getContent());
        userRepository.findById(comment.getUserId()).ifPresent(user -> {
            response.setAuthorName(user.getFullName());
            response.setAuthorAvatarUrl(user.getAvatarUrl());
        });
        response.setLikeCount(0);
        response.setLikedByMe(false);
        response.setCreatedAt(comment.getCreatedAt());
        response.setUpdatedAt(comment.getUpdatedAt());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{postId}/comments/{commentId}/replies")
    public ResponseEntity<PostCommentResponse> createReply(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody PostReplyRequest request) {
        Long actorId = currentUserId();
        var reply = createPostReplyUseCase.execute(actorId, postId, commentId, request.getContent());
        PostCommentResponse response = new PostCommentResponse();
        response.setId(reply.getId());
        response.setPostId(reply.getPostId());
        response.setUserId(reply.getUserId());
        response.setParentCommentId(reply.getParentCommentId());
        response.setContent(reply.getContent());
        userRepository.findById(reply.getUserId()).ifPresent(user -> {
            response.setAuthorName(user.getFullName());
            response.setAuthorAvatarUrl(user.getAvatarUrl());
        });
        response.setLikeCount(0);
        response.setLikedByMe(false);
        response.setCreatedAt(reply.getCreatedAt());
        response.setUpdatedAt(reply.getUpdatedAt());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<java.util.List<PostCommentResponse>> listComments(@PathVariable Long postId) {
        Long actorId = currentUserId();
        var comments = listPostCommentsUseCase.execute(actorId, postId).stream()
                .filter(comment -> !comment.isHiddenByAdmin())
                .map(comment -> {
            PostCommentResponse response = new PostCommentResponse();
            response.setId(comment.getId());
            response.setPostId(comment.getPostId());
            response.setUserId(comment.getUserId());
            response.setParentCommentId(comment.getParentCommentId());
            response.setContent(comment.getContent());
            userRepository.findById(comment.getUserId()).ifPresent(user -> {
                response.setAuthorName(user.getFullName());
                response.setAuthorAvatarUrl(user.getAvatarUrl());
            });
            response.setLikeCount(getPostCommentLikeCountUseCase.execute(comment.getId()));
            response.setLikedByMe(getPostCommentLikeStateUseCase.execute(actorId, comment.getId()));
            response.setCreatedAt(comment.getCreatedAt());
            response.setUpdatedAt(comment.getUpdatedAt());
            return response;
        }).toList();
        return ResponseEntity.ok(comments);
    }

    @PostMapping("/{postId}/comments/{commentId}/like")
    public ResponseEntity<Map<String, Long>> toggleCommentLike(
            @PathVariable Long postId,
            @PathVariable Long commentId) {
        Long actorId = currentUserId();
        long likeCount = togglePostCommentLikeUseCase.execute(actorId, commentId);
        return ResponseEntity.ok(Map.of("likeCount", likeCount));
    }

    @GetMapping("/{postId}/comments/{commentId}/like")
    public ResponseEntity<Map<String, Boolean>> getCommentLikeState(
            @PathVariable Long postId,
            @PathVariable Long commentId) {
        Long actorId = currentUserId();
        boolean liked = getPostCommentLikeStateUseCase.execute(actorId, commentId);
        return ResponseEntity.ok(Map.of("liked", liked));
    }

    @PostMapping("/{postId}/share")
    public ResponseEntity<PostResponse> sharePost(
            @PathVariable Long postId,
            @Valid @RequestBody(required = false) PostShareRequest request) {
        Long actorId = currentUserId();
        String content = request == null ? null : request.getContent();
        var visibility = request == null ? null : request.getVisibility();
        var post = sharePostUseCase.execute(actorId, postId, content, visibility);
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
