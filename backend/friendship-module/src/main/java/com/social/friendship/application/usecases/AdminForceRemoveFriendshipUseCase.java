package com.social.friendship.application.usecases;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.domain.entities.Friendship;
import com.social.friendship.domain.repositories.FriendshipRepository;

@Service
public class AdminForceRemoveFriendshipUseCase {
    private final FriendshipRepository friendshipRepository;

    public AdminForceRemoveFriendshipUseCase(FriendshipRepository friendshipRepository) {
        this.friendshipRepository = friendshipRepository;
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void execute(Long friendshipId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quan hệ bạn bè"));
        friendshipRepository.delete(friendship);
    }
}
