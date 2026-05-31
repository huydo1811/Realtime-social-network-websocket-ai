package com.social.friendship.presentation.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.social.friendship.application.usecases.AcceptFriendRequestUseCase;
import com.social.friendship.application.usecases.AdminForceBlockFriendshipUseCase;
import com.social.friendship.application.usecases.AdminForceRemoveFriendshipUseCase;
import com.social.friendship.application.usecases.AdminListUserFriendshipsUseCase;
import com.social.friendship.application.usecases.BlockUserUseCase;
import com.social.friendship.application.usecases.CancelFriendRequestUseCase;
import com.social.friendship.application.usecases.GetRelationshipStatusUseCase;
import com.social.friendship.application.usecases.ListFriendsUseCase;
import com.social.friendship.application.usecases.ListBlockedUsersUseCase;
import com.social.friendship.application.usecases.ListIncomingRequestsUseCase;
import com.social.friendship.application.usecases.ListOutgoingRequestsUseCase;
import com.social.friendship.application.usecases.RejectFriendRequestUseCase;
import com.social.friendship.application.usecases.RemoveFriendUseCase;
import com.social.friendship.application.usecases.SendFriendRequestUseCase;
import com.social.friendship.application.usecases.UnblockUserUseCase;
import com.social.friendship.presentation.dto.FriendshipActionRequest;
import com.social.friendship.presentation.dto.FriendshipResponse;
import com.social.friendship.presentation.dto.RelationshipStatusResponse;
import com.social.friendship.presentation.dto.AdminForceBlockRequest;
import com.social.friendship.presentation.mapper.FriendshipMapper;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/friendships")
public class FriendshipController {
    private final SendFriendRequestUseCase sendFriendRequestUseCase;
    private final AdminListUserFriendshipsUseCase adminListUserFriendshipsUseCase;
    private final AdminForceBlockFriendshipUseCase adminForceBlockFriendshipUseCase;
    private final AdminForceRemoveFriendshipUseCase adminForceRemoveFriendshipUseCase;
    private final AcceptFriendRequestUseCase acceptFriendRequestUseCase;
    private final RejectFriendRequestUseCase rejectFriendRequestUseCase;
    private final CancelFriendRequestUseCase cancelFriendRequestUseCase;
    private final RemoveFriendUseCase removeFriendUseCase;
    private final BlockUserUseCase blockUserUseCase;
    private final UnblockUserUseCase unblockUserUseCase;
    private final ListFriendsUseCase listFriendsUseCase;
    private final ListBlockedUsersUseCase listBlockedUsersUseCase;
    private final ListIncomingRequestsUseCase listIncomingRequestsUseCase;
    private final ListOutgoingRequestsUseCase listOutgoingRequestsUseCase;
    private final GetRelationshipStatusUseCase getRelationshipStatusUseCase;
    private final FriendshipMapper friendshipMapper;

    public FriendshipController(SendFriendRequestUseCase sendFriendRequestUseCase,
                                AdminListUserFriendshipsUseCase adminListUserFriendshipsUseCase,
                                AdminForceBlockFriendshipUseCase adminForceBlockFriendshipUseCase,
                                AdminForceRemoveFriendshipUseCase adminForceRemoveFriendshipUseCase,
                                AcceptFriendRequestUseCase acceptFriendRequestUseCase,
                                RejectFriendRequestUseCase rejectFriendRequestUseCase,
                                CancelFriendRequestUseCase cancelFriendRequestUseCase,
                                RemoveFriendUseCase removeFriendUseCase,
                                BlockUserUseCase blockUserUseCase,
                                UnblockUserUseCase unblockUserUseCase,
                                ListFriendsUseCase listFriendsUseCase,
                                ListBlockedUsersUseCase listBlockedUsersUseCase,
                                ListIncomingRequestsUseCase listIncomingRequestsUseCase,
                                ListOutgoingRequestsUseCase listOutgoingRequestsUseCase,
                                GetRelationshipStatusUseCase getRelationshipStatusUseCase,
                                FriendshipMapper friendshipMapper) {
        this.sendFriendRequestUseCase = sendFriendRequestUseCase;
        this.adminListUserFriendshipsUseCase = adminListUserFriendshipsUseCase;
        this.adminForceBlockFriendshipUseCase = adminForceBlockFriendshipUseCase;
        this.adminForceRemoveFriendshipUseCase = adminForceRemoveFriendshipUseCase;
        this.acceptFriendRequestUseCase = acceptFriendRequestUseCase;
        this.rejectFriendRequestUseCase = rejectFriendRequestUseCase;
        this.cancelFriendRequestUseCase = cancelFriendRequestUseCase;
        this.removeFriendUseCase = removeFriendUseCase;
        this.blockUserUseCase = blockUserUseCase;
        this.unblockUserUseCase = unblockUserUseCase;
        this.listFriendsUseCase = listFriendsUseCase;
        this.listBlockedUsersUseCase = listBlockedUsersUseCase;
        this.listIncomingRequestsUseCase = listIncomingRequestsUseCase;
        this.listOutgoingRequestsUseCase = listOutgoingRequestsUseCase;
        this.getRelationshipStatusUseCase = getRelationshipStatusUseCase;
        this.friendshipMapper = friendshipMapper;
    }

    @PostMapping("/requests")
    public ResponseEntity<FriendshipResponse> sendRequest(@Valid @RequestBody FriendshipActionRequest request) {
        Long actorId = currentUserId();
        var friendship = sendFriendRequestUseCase.execute(actorId, request.getTargetUserId());
        return ResponseEntity.ok(friendshipMapper.toResponse(friendship));
    }

    @PostMapping("/requests/{requestId}/accept")
    public ResponseEntity<FriendshipResponse> acceptRequest(@PathVariable Long requestId) {
        Long actorId = currentUserId();
        var friendship = acceptFriendRequestUseCase.execute(actorId, requestId);
        return ResponseEntity.ok(friendshipMapper.toResponse(friendship));
    }

    @PostMapping("/requests/{requestId}/reject")
    public ResponseEntity<FriendshipResponse> rejectRequest(@PathVariable Long requestId) {
        Long actorId = currentUserId();
        var friendship = rejectFriendRequestUseCase.execute(actorId, requestId);
        return ResponseEntity.ok(friendshipMapper.toResponse(friendship));
    }

    @DeleteMapping("/requests/{requestId}")
    public ResponseEntity<Void> cancelRequest(@PathVariable Long requestId) {
        Long actorId = currentUserId();
        cancelFriendRequestUseCase.execute(actorId, requestId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{friendshipId}")
    public ResponseEntity<Void> removeFriend(@PathVariable Long friendshipId) {
        Long actorId = currentUserId();
        removeFriendUseCase.execute(actorId, friendshipId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/blocks")
    public ResponseEntity<FriendshipResponse> blockUser(@Valid @RequestBody FriendshipActionRequest request) {
        Long actorId = currentUserId();
        var friendship = blockUserUseCase.execute(actorId, request.getTargetUserId());
        return ResponseEntity.ok(friendshipMapper.toResponse(friendship));
    }

    @DeleteMapping("/blocks")
    public ResponseEntity<Void> unblockUser(@Valid @RequestBody FriendshipActionRequest request) {
        Long actorId = currentUserId();
        unblockUserUseCase.execute(actorId, request.getTargetUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/friends")
    public ResponseEntity<List<FriendshipResponse>> listFriends() {
        Long actorId = currentUserId();
        List<FriendshipResponse> response = listFriendsUseCase.execute(actorId).stream()
                .map(friendshipMapper::toResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/users/{userId}")
    public ResponseEntity<List<FriendshipResponse>> adminListByUser(@PathVariable Long userId) {
        List<FriendshipResponse> response = adminListUserFriendshipsUseCase.execute(userId).stream()
                .map(friendshipMapper::toResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/{friendshipId}/force-block")
    public ResponseEntity<FriendshipResponse> adminForceBlock(
            @PathVariable Long friendshipId,
            @Valid @RequestBody AdminForceBlockRequest request) {
        var friendship = adminForceBlockFriendshipUseCase.execute(friendshipId, request.getBlockerUserId());
        return ResponseEntity.ok(friendshipMapper.toResponse(friendship));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/{friendshipId}")
    public ResponseEntity<Void> adminForceRemove(@PathVariable Long friendshipId) {
        adminForceRemoveFriendshipUseCase.execute(friendshipId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/blocks")
    public ResponseEntity<List<FriendshipResponse>> listBlockedUsers() {
        Long actorId = currentUserId();
        List<FriendshipResponse> response = listBlockedUsersUseCase.execute(actorId).stream()
                .map(friendshipMapper::toResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/requests/incoming")
    public ResponseEntity<List<FriendshipResponse>> listIncomingRequests() {
        Long actorId = currentUserId();
        List<FriendshipResponse> response = listIncomingRequestsUseCase.execute(actorId).stream()
                .map(friendshipMapper::toResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/requests/outgoing")
    public ResponseEntity<List<FriendshipResponse>> listOutgoingRequests() {
        Long actorId = currentUserId();
        List<FriendshipResponse> response = listOutgoingRequestsUseCase.execute(actorId).stream()
                .map(friendshipMapper::toResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    public ResponseEntity<RelationshipStatusResponse> relationshipStatus(@RequestParam Long targetUserId) {
        Long actorId = currentUserId();
        var friendship = getRelationshipStatusUseCase.execute(actorId, targetUserId).orElse(null);
        return ResponseEntity.ok(friendshipMapper.toStatusResponse(actorId, targetUserId, friendship));
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
