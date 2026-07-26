package com.social.friendship.presentation.controllers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.social.friendship.domain.entities.GroupMembershipRole;
import com.social.friendship.domain.entities.GroupMembershipStatus;
import com.social.friendship.domain.entities.GroupPostStatus;
import com.social.friendship.domain.entities.GroupVisibility;
import com.social.friendship.domain.entities.SocialGroup;
import com.social.friendship.domain.entities.SocialGroupMembership;
import com.social.friendship.domain.entities.SocialGroupPost;
import com.social.friendship.domain.entities.SocialGroupPostComment;
import com.social.friendship.domain.entities.SocialGroupPostLike;
import com.social.friendship.domain.exceptions.GroupPostImageModerationRejectedException;
import com.social.friendship.domain.exceptions.GroupPostTextModerationRejectedException;
import com.social.friendship.infrastructure.repositories.JpaSocialGroupMembershipRepository;
import com.social.friendship.infrastructure.repositories.JpaSocialGroupPostCommentRepository;
import com.social.friendship.infrastructure.repositories.JpaSocialGroupPostLikeRepository;
import com.social.friendship.infrastructure.repositories.JpaSocialGroupPostRepository;
import com.social.friendship.infrastructure.repositories.JpaSocialGroupRepository;
import com.social.friendship.presentation.dto.CreateGroupPostCommentRequest;
import com.social.friendship.presentation.dto.CreateGroupPostRequest;
import com.social.friendship.presentation.dto.CreateGroupRequest;
import com.social.friendship.presentation.dto.GroupMembershipResponse;
import com.social.friendship.presentation.dto.GroupPostCommentResponse;
import com.social.friendship.presentation.dto.GroupPostResponse;
import com.social.friendship.presentation.dto.GroupResponse;
import com.social.moderation.application.usecases.ModerateImageUseCase;
import com.social.moderation.application.usecases.ModerateTextUseCase;
import com.social.moderation.domain.ModerationAction;
import com.social.moderation.domain.entities.ModerationAudit.TargetType;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/groups")
public class GroupController {
    private final JpaSocialGroupRepository groupRepository;
    private final JpaSocialGroupMembershipRepository membershipRepository;
    private final JpaSocialGroupPostRepository postRepository;
    private final JpaSocialGroupPostLikeRepository likeRepository;
    private final JpaSocialGroupPostCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final ModerateTextUseCase moderateTextUseCase;
    private final ModerateImageUseCase moderateImageUseCase;

    public GroupController(
            JpaSocialGroupRepository groupRepository,
            JpaSocialGroupMembershipRepository membershipRepository,
            JpaSocialGroupPostRepository postRepository,
            JpaSocialGroupPostLikeRepository likeRepository,
            JpaSocialGroupPostCommentRepository commentRepository,
            UserRepository userRepository,
            ModerateTextUseCase moderateTextUseCase,
            ModerateImageUseCase moderateImageUseCase) {
        this.groupRepository = groupRepository;
        this.membershipRepository = membershipRepository;
        this.postRepository = postRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.moderateTextUseCase = moderateTextUseCase;
        this.moderateImageUseCase = moderateImageUseCase;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<GroupResponse> create(@Valid @RequestBody CreateGroupRequest request) {
        Long actorId = currentUserId();
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        SocialGroup created = groupRepository.save(
                SocialGroup.create(
                        actorId,
                        request.getName(),
                        request.getDescription(),
                        request.getVisibility(),
                        request.isRequireApproval(),
                        request.isRequirePostApproval()));
        membershipRepository.save(SocialGroupMembership.owner(created.getId(), actorId));
        return ResponseEntity.ok(toGroupResponse(created, actor));
    }

    @GetMapping("/discover")
    public ResponseEntity<List<GroupResponse>> discover(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) GroupVisibility visibility) {
        return ResponseEntity.ok(groupRepository.search(q, visibility).stream().map(this::toGroupResponse).toList());
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<GroupResponse> getById(@PathVariable Long groupId) {
        currentUserId();
        SocialGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhóm"));
        return ResponseEntity.ok(toGroupResponse(group));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<GroupMembershipResponse>> mine() {
        Long actorId = currentUserId();
        return ResponseEntity.ok(membershipRepository.findByUserIdOrderByRequestedAtDesc(actorId).stream()
                .map(this::toMembershipResponse)
                .toList());
    }

    @GetMapping("/mine/owned")
    public ResponseEntity<List<GroupResponse>> mineOwned() {
        Long actorId = currentUserId();
        List<Long> ownedIds = membershipRepository.findByUserIdOrderByRequestedAtDesc(actorId).stream()
                .filter(row -> row.getRole() == GroupMembershipRole.OWNER && row.getStatus() == GroupMembershipStatus.APPROVED)
                .map(SocialGroupMembership::getGroupId)
                .toList();
        if (ownedIds.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        Map<Long, SocialGroup> map = groupRepository.findAllById(ownedIds).stream()
                .collect(Collectors.toMap(SocialGroup::getId, Function.identity()));
        return ResponseEntity.ok(ownedIds.stream()
                .map(map::get)
                .filter(g -> g != null)
                .map(this::toGroupResponse)
                .toList());
    }

    @GetMapping("/feed")
    public ResponseEntity<List<GroupPostResponse>> feed(@RequestParam(defaultValue = "30") int limit) {
        Long actorId = currentUserId();
        int safeLimit = Math.max(1, Math.min(limit, 100));
        List<Long> groupIds = membershipRepository.findByUserIdAndStatusOrderByRequestedAtDesc(actorId, GroupMembershipStatus.APPROVED)
                .stream()
                .map(SocialGroupMembership::getGroupId)
                .distinct()
                .toList();
        if (groupIds.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        Map<Long, SocialGroup> groupMap = groupRepository.findAllById(groupIds).stream()
                .collect(Collectors.toMap(SocialGroup::getId, Function.identity()));
        List<SocialGroupPost> rows = postRepository.findTop100ByGroupIdInAndStatusOrderByCreatedAtDesc(groupIds, GroupPostStatus.APPROVED)
                .stream()
                .limit(safeLimit)
                .toList();
        return ResponseEntity.ok(rows.stream().map(row -> {
            String groupName = groupMap.get(row.getGroupId()) == null ? null : groupMap.get(row.getGroupId()).getName();
            return toPostResponse(row, groupName, actorId);
        }).toList());
    }

    @PostMapping("/{groupId}/join")
    @Transactional
    public ResponseEntity<GroupMembershipResponse> join(@PathVariable Long groupId) {
        Long actorId = currentUserId();
        SocialGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhóm"));
        SocialGroupMembership existing = membershipRepository.findByGroupIdAndUserId(groupId, actorId).orElse(null);
        if (existing != null && existing.getStatus() != GroupMembershipStatus.REJECTED) {
            return ResponseEntity.ok(toMembershipResponse(existing));
        }
        boolean autoApprove = group.getVisibility() == GroupVisibility.PUBLIC && !group.isRequireApproval();
        SocialGroupMembership created = SocialGroupMembership.joinRequest(groupId, actorId, autoApprove);
        return ResponseEntity.ok(toMembershipResponse(membershipRepository.save(created)));
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<GroupMembershipResponse>> listMembers(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "APPROVED") GroupMembershipStatus status) {
        currentUserId();
        return ResponseEntity.ok(membershipRepository.findByGroupIdAndStatusOrderByRequestedAtDesc(groupId, status)
                .stream().map(this::toMembershipResponse).toList());
    }

    @PostMapping("/{groupId}/members/{membershipId}/approve")
    @Transactional
    public ResponseEntity<GroupMembershipResponse> approve(@PathVariable Long groupId, @PathVariable Long membershipId) {
        Long actorId = currentUserId();
        ensureGroupOwner(groupId, actorId);
        SocialGroupMembership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu thành viên"));
        if (!groupId.equals(membership.getGroupId())) {
            throw new IllegalArgumentException("Yêu cầu không thuộc nhóm này");
        }
        membership.approve(actorId);
        return ResponseEntity.ok(toMembershipResponse(membershipRepository.save(membership)));
    }

    @PostMapping("/{groupId}/members/{membershipId}/reject")
    @Transactional
    public ResponseEntity<GroupMembershipResponse> reject(@PathVariable Long groupId, @PathVariable Long membershipId) {
        Long actorId = currentUserId();
        ensureGroupOwner(groupId, actorId);
        SocialGroupMembership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu thành viên"));
        if (!groupId.equals(membership.getGroupId())) {
            throw new IllegalArgumentException("Yêu cầu không thuộc nhóm này");
        }
        membership.reject(actorId);
        return ResponseEntity.ok(toMembershipResponse(membershipRepository.save(membership)));
    }

    @PostMapping("/{groupId}/posts")
    @Transactional
    public ResponseEntity<GroupPostResponse> createPost(
            @PathVariable Long groupId,
            @Valid @RequestBody CreateGroupPostRequest request) {
        Long actorId = currentUserId();
        SocialGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhóm"));
        if (!canWrite(group, actorId)) {
            throw new IllegalArgumentException("Bạn cần tham gia nhóm trước khi đăng bài");
        }
        String normalizedContent = request.getContent() == null ? "" : request.getContent().trim();
        String normalizedMediaUrl = request.getMediaUrl() == null ? null : request.getMediaUrl().trim();
        if (normalizedContent.isBlank() && (normalizedMediaUrl == null || normalizedMediaUrl.isBlank())) {
            throw new IllegalArgumentException("Phải có nội dung hoặc ảnh/video");
        }
        if (normalizedMediaUrl != null && !normalizedMediaUrl.isBlank() && !isVideo(normalizedMediaUrl)) {
            var imageResult = moderateImageUseCase.moderate(normalizedMediaUrl);
            if (imageResult.violation()) {
                throw new GroupPostImageModerationRejectedException(imageResult);
            }
        }
        var decision = normalizedContent.isBlank()
                ? null
                : moderateTextUseCase.moderate(normalizedContent);
        if (decision != null && decision.action() == ModerationAction.HARD_REJECT) {
            throw new GroupPostTextModerationRejectedException(decision.result());
        }
        boolean needApproval = (group.isRequirePostApproval() && !isGroupOwner(groupId, actorId))
                || (decision != null && decision.action() == ModerationAction.SOFT_HIDE);
        SocialGroupPost created = postRepository.save(
                SocialGroupPost.create(groupId, actorId, normalizedContent, normalizedMediaUrl, needApproval));
        if (decision != null) {
            try {
                moderateTextUseCase.audit(
                        TargetType.POST,
                        created.getId(),
                        actorId,
                        normalizedContent,
                        decision
                );
            } catch (Exception ignored) {
                // audit failures must not break create post flow
            }
        }
        return ResponseEntity.ok(toPostResponse(created, group.getName(), actorId));
    }

    @GetMapping("/{groupId}/posts")
    public ResponseEntity<List<GroupPostResponse>> listPosts(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "APPROVED") GroupPostStatus status) {
        Long actorId = currentUserId();
        SocialGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhóm"));
        if (!canView(group, actorId)) {
            throw new IllegalArgumentException("Bạn không có quyền xem bài trong nhóm này");
        }
        boolean owner = isGroupOwner(groupId, actorId);
        List<SocialGroupPost> rows;
        if (owner) {
            rows = postRepository.findByGroupIdAndStatusOrderByCreatedAtDesc(groupId, status);
        } else {
            List<SocialGroupPost> approved = postRepository.findByGroupIdAndStatusOrderByCreatedAtDesc(groupId, GroupPostStatus.APPROVED);
            List<SocialGroupPost> minePending = postRepository
                    .findByGroupIdAndAuthorUserIdAndStatusOrderByCreatedAtDesc(groupId, actorId, GroupPostStatus.PENDING);
            rows = new ArrayList<>(approved.size() + minePending.size());
            rows.addAll(minePending);
            rows.addAll(approved);
            rows.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        }
        return ResponseEntity.ok(rows.stream().map(row -> toPostResponse(row, group.getName(), actorId)).toList());
    }

    @PostMapping("/{groupId}/posts/{postId}/approve")
    @Transactional
    public ResponseEntity<GroupPostResponse> approvePost(@PathVariable Long groupId, @PathVariable Long postId) {
        Long actorId = currentUserId();
        ensureGroupOwner(groupId, actorId);
        SocialGroupPost post = requirePost(groupId, postId);
        post.approve(actorId);
        SocialGroupPost saved = postRepository.save(post);
        SocialGroup group = groupRepository.findById(groupId).orElse(null);
        return ResponseEntity.ok(toPostResponse(saved, group == null ? null : group.getName(), actorId));
    }

    @PostMapping("/{groupId}/posts/{postId}/reject")
    @Transactional
    public ResponseEntity<GroupPostResponse> rejectPost(@PathVariable Long groupId, @PathVariable Long postId) {
        Long actorId = currentUserId();
        ensureGroupOwner(groupId, actorId);
        SocialGroupPost post = requirePost(groupId, postId);
        post.reject(actorId);
        SocialGroupPost saved = postRepository.save(post);
        SocialGroup group = groupRepository.findById(groupId).orElse(null);
        return ResponseEntity.ok(toPostResponse(saved, group == null ? null : group.getName(), actorId));
    }

    @PostMapping("/{groupId}/posts/{postId}/like")
    @Transactional
    public ResponseEntity<Map<String, Object>> toggleLike(@PathVariable Long groupId, @PathVariable Long postId) {
        Long actorId = currentUserId();
        SocialGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhóm"));
        if (!canView(group, actorId)) {
            throw new IllegalArgumentException("Bạn không có quyền tương tác bài viết này");
        }
        SocialGroupPost post = requirePost(groupId, postId);
        if (post.getStatus() != GroupPostStatus.APPROVED) {
            throw new IllegalArgumentException("Chỉ có thể thích bài đã được duyệt");
        }
        var existing = likeRepository.findByPostIdAndUserId(postId, actorId);
        boolean liked;
        if (existing.isPresent()) {
            likeRepository.delete(existing.get());
            liked = false;
        } else {
            likeRepository.save(SocialGroupPostLike.create(postId, actorId));
            liked = true;
        }
        Map<String, Object> body = new HashMap<>();
        body.put("liked", liked);
        body.put("likeCount", likeRepository.countByPostId(postId));
        return ResponseEntity.ok(body);
    }

    @GetMapping("/{groupId}/posts/{postId}/comments")
    public ResponseEntity<List<GroupPostCommentResponse>> listComments(
            @PathVariable Long groupId,
            @PathVariable Long postId) {
        Long actorId = currentUserId();
        SocialGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhóm"));
        if (!canView(group, actorId)) {
            throw new IllegalArgumentException("Bạn không có quyền xem bình luận");
        }
        requirePost(groupId, postId);
        return ResponseEntity.ok(commentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream()
                .map(row -> GroupPostCommentResponse.from(row, userRepository.findById(row.getUserId()).orElse(null)))
                .toList());
    }

    @PostMapping("/{groupId}/posts/{postId}/comments")
    @Transactional
    public ResponseEntity<GroupPostCommentResponse> createComment(
            @PathVariable Long groupId,
            @PathVariable Long postId,
            @Valid @RequestBody CreateGroupPostCommentRequest request) {
        Long actorId = currentUserId();
        SocialGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhóm"));
        if (!canWrite(group, actorId)) {
            throw new IllegalArgumentException("Bạn cần tham gia nhóm để bình luận");
        }
        SocialGroupPost post = requirePost(groupId, postId);
        if (post.getStatus() != GroupPostStatus.APPROVED) {
            throw new IllegalArgumentException("Chỉ có thể bình luận bài đã được duyệt");
        }
        SocialGroupPostComment saved = commentRepository.save(
                SocialGroupPostComment.create(postId, actorId, request.getContent()));
        return ResponseEntity.ok(GroupPostCommentResponse.from(
                saved, userRepository.findById(actorId).orElse(null)));
    }

    private GroupResponse toGroupResponse(SocialGroup group) {
        User owner = userRepository.findById(group.getOwnerUserId()).orElse(null);
        return toGroupResponse(group, owner);
    }

    private GroupResponse toGroupResponse(SocialGroup group, User owner) {
        return GroupResponse.from(group, owner == null ? null : owner.getFullName());
    }

    private GroupMembershipResponse toMembershipResponse(SocialGroupMembership row) {
        return GroupMembershipResponse.from(row, userRepository.findById(row.getUserId()).orElse(null));
    }

    private GroupPostResponse toPostResponse(SocialGroupPost row, String groupName, Long actorId) {
        User author = userRepository.findById(row.getAuthorUserId()).orElse(null);
        long likes = likeRepository.countByPostId(row.getId());
        long comments = commentRepository.countByPostId(row.getId());
        boolean liked = actorId != null && likeRepository.existsByPostIdAndUserId(row.getId(), actorId);
        return GroupPostResponse.from(row, author, groupName, likes, comments, liked);
    }

    private SocialGroupPost requirePost(Long groupId, Long postId) {
        SocialGroupPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết nhóm"));
        if (!groupId.equals(post.getGroupId())) {
            throw new IllegalArgumentException("Bài viết không thuộc nhóm này");
        }
        return post;
    }

    private void ensureGroupOwner(Long groupId, Long actorId) {
        SocialGroupMembership owner = membershipRepository.findByGroupIdAndUserId(groupId, actorId)
                .orElseThrow(() -> new IllegalArgumentException("Bạn chưa tham gia nhóm"));
        if (owner.getRole() != GroupMembershipRole.OWNER) {
            throw new IllegalArgumentException("Chỉ trưởng nhóm mới được duyệt thành viên");
        }
    }

    private boolean isGroupOwner(Long groupId, Long actorId) {
        return membershipRepository.findByGroupIdAndUserId(groupId, actorId)
                .map(row -> row.getRole() == GroupMembershipRole.OWNER && row.getStatus() == GroupMembershipStatus.APPROVED)
                .orElse(false);
    }

    private boolean canView(SocialGroup group, Long actorId) {
        if (group.getVisibility() == GroupVisibility.PUBLIC) {
            return true;
        }
        return membershipRepository.findByGroupIdAndUserId(group.getId(), actorId)
                .map(row -> row.getStatus() == GroupMembershipStatus.APPROVED)
                .orElse(false);
    }

    private boolean canWrite(SocialGroup group, Long actorId) {
        return membershipRepository.findByGroupIdAndUserId(group.getId(), actorId)
                .map(row -> row.getStatus() == GroupMembershipStatus.APPROVED)
                .orElse(false);
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

    private static boolean isVideo(String mediaUrl) {
        String value = mediaUrl.toLowerCase();
        return value.contains("/video/upload/")
                || value.endsWith(".mp4")
                || value.endsWith(".mov")
                || value.endsWith(".webm")
                || value.endsWith(".m4v")
                || value.endsWith(".avi")
                || value.endsWith(".mkv");
    }
}
