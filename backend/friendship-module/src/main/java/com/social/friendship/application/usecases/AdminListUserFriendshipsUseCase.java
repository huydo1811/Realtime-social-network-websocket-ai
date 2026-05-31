package com.social.friendship.application.usecases;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import com.social.friendship.domain.entities.Friendship;
import com.social.friendship.domain.repositories.FriendshipRepository;

@Service
public class AdminListUserFriendshipsUseCase {
    private final FriendshipRepository friendshipRepository;

    public AdminListUserFriendshipsUseCase(FriendshipRepository friendshipRepository) {
        this.friendshipRepository = friendshipRepository;
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<Friendship> execute(Long userId) {
        return friendshipRepository.findByUserId(userId);
    }
}
