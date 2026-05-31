package com.social.friendship.application.usecases;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.domain.entities.Friendship;
import com.social.friendship.domain.exceptions.FriendshipDomainException;
import com.social.friendship.domain.repositories.FriendshipRepository;

@Service
public class AdminForceBlockFriendshipUseCase {
    private final FriendshipRepository friendshipRepository;

    public AdminForceBlockFriendshipUseCase(FriendshipRepository friendshipRepository) {
        this.friendshipRepository = friendshipRepository;
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public Friendship execute(Long friendshipId, Long blockerUserId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new FriendshipDomainException("Không tìm thấy quan hệ bạn bè"));

        if (!friendship.containsUser(blockerUserId)) {
            throw new FriendshipDomainException("User chặn phải thuộc quan hệ này");
        }

        friendship.block(blockerUserId);
        return friendshipRepository.save(friendship);
    }
}
