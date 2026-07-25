package com.social.friendship.presentation.controllers;

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
import com.social.friendship.infrastructure.repositories.JpaSocialGroupMembershipRepository;
import com.social.friendship.infrastructure.repositories.JpaSocialGroupPostRepository;
import com.social.friendship.infrastructure.repositories.JpaSocialGroupRepository;
import com.social.friendship.presentation.dto.CreateGroupPostRequest;
import com.social.friendship.presentation.dto.CreateGroupRequest;
import com.social.friendship.presentation.dto.GroupMembershipResponse;
import com.social.friendship.presentation.dto.GroupPostResponse;
import com.social.friendship.presentation.dto.GroupResponse;
import com.social.user.domain.repositories.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/groups")
public class GroupController {
    private final JpaSocialGroupRepository groupRepository;
    private final JpaSocialGroupMembershipRepository membershipRepository;
    private final JpaSocialGroupPostRepository postRepository;
    private final UserRepository userRepository;

    public GroupController(
            JpaSocialGroupRepository groupRepository,
            JpaSocialGroupMembershipRepository membershipRepository,
            JpaSocialGroupPostRepository postRepository,
            UserRepository userRepository) {
        this.groupRepository = groupRepository;
        this.membershipRepository = membershipRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<GroupResponse> create(@Valid @RequestBody CreateGroupRequest request) {
        Long actorId = currentUserId();
        userRepository.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        SocialGroup created = groupRepository.save(
                SocialGroup.create(actorId, request.getName(), request.getDescription(), request.getVisibility(), request.isRequireApproval()));
        membershipRepository.save(SocialGroupMembership.owner(created.getId(), actorId));
        return ResponseEntity.ok(GroupResponse.from(created));
    }

    @GetMapping("/discover")
    public ResponseEntity<List<GroupResponse>> discover(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) GroupVisibility visibility) {
        return ResponseEntity.ok(groupRepository.search(q, visibility).stream().map(GroupResponse::from).toList());
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<GroupResponse> getById(@PathVariable Long groupId) {
        currentUserId();
        SocialGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhóm"));
        return ResponseEntity.ok(GroupResponse.from(group));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<GroupMembershipResponse>> mine() {
        Long actorId = currentUserId();
        return ResponseEntity.ok(membershipRepository.findByUserIdOrderByRequestedAtDesc(actorId).stream()
                .map(GroupMembershipResponse::from).toList());
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
            var author = userRepository.findById(row.getAuthorUserId()).orElse(null);
            String groupName = groupMap.get(row.getGroupId()) == null ? null : groupMap.get(row.getGroupId()).getName();
            return GroupPostResponse.from(row, author, groupName);
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
            return ResponseEntity.ok(GroupMembershipResponse.from(existing));
        }
        boolean autoApprove = group.getVisibility() == GroupVisibility.PUBLIC && !group.isRequireApproval();
        SocialGroupMembership created = SocialGroupMembership.joinRequest(groupId, actorId, autoApprove);
        return ResponseEntity.ok(GroupMembershipResponse.from(membershipRepository.save(created)));
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<GroupMembershipResponse>> listMembers(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "APPROVED") GroupMembershipStatus status) {
        currentUserId();
        return ResponseEntity.ok(membershipRepository.findByGroupIdAndStatusOrderByRequestedAtDesc(groupId, status)
                .stream().map(GroupMembershipResponse::from).toList());
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
        return ResponseEntity.ok(GroupMembershipResponse.from(membershipRepository.save(membership)));
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
        return ResponseEntity.ok(GroupMembershipResponse.from(membershipRepository.save(membership)));
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
        boolean needApproval = group.isRequireApproval() && !isGroupOwner(groupId, actorId);
        SocialGroupPost created = postRepository.save(
                SocialGroupPost.create(groupId, actorId, normalizedContent, normalizedMediaUrl, needApproval));
        var author = userRepository.findById(created.getAuthorUserId()).orElse(null);
        return ResponseEntity.ok(GroupPostResponse.from(created, author));
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
        GroupPostStatus effectiveStatus = owner ? status : GroupPostStatus.APPROVED;
        return ResponseEntity.ok(postRepository.findByGroupIdAndStatusOrderByCreatedAtDesc(groupId, effectiveStatus).stream()
                .map(row -> GroupPostResponse.from(row, userRepository.findById(row.getAuthorUserId()).orElse(null)))
                .toList());
    }

    @PostMapping("/{groupId}/posts/{postId}/approve")
    @Transactional
    public ResponseEntity<GroupPostResponse> approvePost(@PathVariable Long groupId, @PathVariable Long postId) {
        Long actorId = currentUserId();
        ensureGroupOwner(groupId, actorId);
        SocialGroupPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết nhóm"));
        if (!groupId.equals(post.getGroupId())) {
            throw new IllegalArgumentException("Bài viết không thuộc nhóm này");
        }
        post.approve(actorId);
        SocialGroupPost saved = postRepository.save(post);
        return ResponseEntity.ok(GroupPostResponse.from(saved, userRepository.findById(saved.getAuthorUserId()).orElse(null)));
    }

    @PostMapping("/{groupId}/posts/{postId}/reject")
    @Transactional
    public ResponseEntity<GroupPostResponse> rejectPost(@PathVariable Long groupId, @PathVariable Long postId) {
        Long actorId = currentUserId();
        ensureGroupOwner(groupId, actorId);
        SocialGroupPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết nhóm"));
        if (!groupId.equals(post.getGroupId())) {
            throw new IllegalArgumentException("Bài viết không thuộc nhóm này");
        }
        post.reject(actorId);
        SocialGroupPost saved = postRepository.save(post);
        return ResponseEntity.ok(GroupPostResponse.from(saved, userRepository.findById(saved.getAuthorUserId()).orElse(null)));
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
}
