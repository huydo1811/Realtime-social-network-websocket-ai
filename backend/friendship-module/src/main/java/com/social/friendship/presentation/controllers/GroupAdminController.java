package com.social.friendship.presentation.controllers;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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
import com.social.friendship.presentation.dto.AdminGroupDetailResponse;
import com.social.friendship.presentation.dto.GroupMembershipResponse;
import com.social.friendship.presentation.dto.GroupPostResponse;
import com.social.friendship.presentation.dto.GroupResponse;
import com.social.user.domain.repositories.UserRepository;

@RestController
@RequestMapping("/groups/admin")
@PreAuthorize("hasRole('ADMIN')")
public class GroupAdminController {
    private final JpaSocialGroupRepository groupRepository;
    private final JpaSocialGroupMembershipRepository membershipRepository;
    private final JpaSocialGroupPostRepository postRepository;
    private final UserRepository userRepository;

    public GroupAdminController(
            JpaSocialGroupRepository groupRepository,
            JpaSocialGroupMembershipRepository membershipRepository,
            JpaSocialGroupPostRepository postRepository,
            UserRepository userRepository) {
        this.groupRepository = groupRepository;
        this.membershipRepository = membershipRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<Page<GroupResponse>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) GroupVisibility visibility,
            @RequestParam(required = false) Long ownerUserId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(100, size));
        String query = q == null || q.isBlank() ? null : q.trim();
        Page<GroupResponse> result = groupRepository
                .searchAdmin(query, visibility, ownerUserId, PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(row -> GroupResponse.from(
                        row,
                        userRepository.findById(row.getOwnerUserId()).map(u -> u.getFullName()).orElse(null)));
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<AdminGroupDetailResponse> getDetail(@PathVariable Long groupId) {
        SocialGroup group = requireGroup(groupId);
        String ownerName = userRepository.findById(group.getOwnerUserId())
                .map(u -> u.getFullName())
                .orElse(null);
        return ResponseEntity.ok(AdminGroupDetailResponse.from(
                group,
                ownerName,
                membershipRepository.countByGroupIdAndStatus(groupId, GroupMembershipStatus.APPROVED),
                membershipRepository.countByGroupIdAndStatus(groupId, GroupMembershipStatus.PENDING),
                postRepository.countByGroupId(groupId),
                postRepository.countByGroupIdAndStatus(groupId, GroupPostStatus.PENDING)));
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<GroupMembershipResponse>> listMembers(
            @PathVariable Long groupId,
            @RequestParam(required = false) GroupMembershipStatus status) {
        requireGroup(groupId);
        List<SocialGroupMembership> rows = status == null
                ? membershipRepository.findByGroupIdOrderByRequestedAtDesc(groupId)
                : membershipRepository.findByGroupIdAndStatusOrderByRequestedAtDesc(groupId, status);
        return ResponseEntity.ok(rows.stream()
                .map(row -> GroupMembershipResponse.from(row, userRepository.findById(row.getUserId()).orElse(null)))
                .toList());
    }

    @GetMapping("/{groupId}/posts")
    public ResponseEntity<List<GroupPostResponse>> listPosts(
            @PathVariable Long groupId,
            @RequestParam(required = false) GroupPostStatus status) {
        SocialGroup group = requireGroup(groupId);
        List<SocialGroupPost> rows = status == null
                ? postRepository.findByGroupIdOrderByCreatedAtDesc(groupId)
                : postRepository.findByGroupIdAndStatusOrderByCreatedAtDesc(groupId, status);
        return ResponseEntity.ok(rows.stream()
                .map(row -> GroupPostResponse.from(row, userRepository.findById(row.getAuthorUserId()).orElse(null), group.getName()))
                .toList());
    }

    @PostMapping("/{groupId}/members/{membershipId}/approve")
    @Transactional
    public ResponseEntity<GroupMembershipResponse> approveMember(
            @PathVariable Long groupId,
            @PathVariable Long membershipId) {
        Long actorId = currentUserId();
        SocialGroupMembership membership = requireMembership(groupId, membershipId);
        if (membership.getRole() == GroupMembershipRole.OWNER) {
            throw new IllegalArgumentException("Không thể duyệt lại tài khoản trưởng nhóm");
        }
        membership.approve(actorId);
        return ResponseEntity.ok(GroupMembershipResponse.from(membershipRepository.save(membership)));
    }

    @PostMapping("/{groupId}/members/{membershipId}/reject")
    @Transactional
    public ResponseEntity<GroupMembershipResponse> rejectMember(
            @PathVariable Long groupId,
            @PathVariable Long membershipId) {
        Long actorId = currentUserId();
        SocialGroupMembership membership = requireMembership(groupId, membershipId);
        if (membership.getRole() == GroupMembershipRole.OWNER) {
            throw new IllegalArgumentException("Không thể từ chối trưởng nhóm");
        }
        membership.reject(actorId);
        return ResponseEntity.ok(GroupMembershipResponse.from(membershipRepository.save(membership)));
    }

    @DeleteMapping("/{groupId}/members/{membershipId}")
    @Transactional
    public ResponseEntity<Void> removeMember(
            @PathVariable Long groupId,
            @PathVariable Long membershipId) {
        SocialGroupMembership membership = requireMembership(groupId, membershipId);
        if (membership.getRole() == GroupMembershipRole.OWNER) {
            throw new IllegalArgumentException("Không thể gỡ trưởng nhóm. Hãy xóa cả nhóm nếu cần.");
        }
        membershipRepository.delete(membership);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{groupId}/posts/{postId}/approve")
    @Transactional
    public ResponseEntity<GroupPostResponse> approvePost(
            @PathVariable Long groupId,
            @PathVariable Long postId) {
        Long actorId = currentUserId();
        SocialGroup group = requireGroup(groupId);
        SocialGroupPost post = requirePost(groupId, postId);
        post.approve(actorId);
        SocialGroupPost saved = postRepository.save(post);
        return ResponseEntity.ok(GroupPostResponse.from(
                saved,
                userRepository.findById(saved.getAuthorUserId()).orElse(null),
                group.getName()));
    }

    @PostMapping("/{groupId}/posts/{postId}/reject")
    @Transactional
    public ResponseEntity<GroupPostResponse> rejectPost(
            @PathVariable Long groupId,
            @PathVariable Long postId) {
        Long actorId = currentUserId();
        SocialGroup group = requireGroup(groupId);
        SocialGroupPost post = requirePost(groupId, postId);
        post.reject(actorId);
        SocialGroupPost saved = postRepository.save(post);
        return ResponseEntity.ok(GroupPostResponse.from(
                saved,
                userRepository.findById(saved.getAuthorUserId()).orElse(null),
                group.getName()));
    }

    @DeleteMapping("/{groupId}")
    @Transactional
    public ResponseEntity<Void> deleteGroup(@PathVariable Long groupId) {
        requireGroup(groupId);
        postRepository.deleteByGroupId(groupId);
        membershipRepository.deleteByGroupId(groupId);
        groupRepository.deleteById(groupId);
        return ResponseEntity.noContent().build();
    }

    private SocialGroup requireGroup(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhóm"));
    }

    private SocialGroupMembership requireMembership(Long groupId, Long membershipId) {
        SocialGroupMembership membership = membershipRepository.findById(membershipId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thành viên"));
        if (!groupId.equals(membership.getGroupId())) {
            throw new IllegalArgumentException("Thành viên không thuộc nhóm này");
        }
        return membership;
    }

    private SocialGroupPost requirePost(Long groupId, Long postId) {
        SocialGroupPost post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết nhóm"));
        if (!groupId.equals(post.getGroupId())) {
            throw new IllegalArgumentException("Bài viết không thuộc nhóm này");
        }
        return post;
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
