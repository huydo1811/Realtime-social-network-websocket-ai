package com.social.friendship.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.domain.repositories.UserFollowRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class UnfollowUserUseCase {
    private final UserFollowRepository userFollowRepository;
    private final UserRepository userRepository;

    public UnfollowUserUseCase(UserFollowRepository userFollowRepository, UserRepository userRepository) {
        this.userFollowRepository = userFollowRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void execute(Long actorId, Long targetUserId) {
        userRepository.findById(actorId)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Người được theo dõi không tồn tại"));
        userFollowRepository.findByFollowerAndFollowee(actorId, targetUserId)
                .ifPresent(userFollowRepository::delete);
    }
}
