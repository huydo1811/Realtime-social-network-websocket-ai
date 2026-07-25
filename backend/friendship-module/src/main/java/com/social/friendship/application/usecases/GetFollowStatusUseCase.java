package com.social.friendship.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.domain.repositories.UserFollowRepository;

@Service
public class GetFollowStatusUseCase {
    private final UserFollowRepository userFollowRepository;

    public GetFollowStatusUseCase(UserFollowRepository userFollowRepository) {
        this.userFollowRepository = userFollowRepository;
    }

    @Transactional(readOnly = true)
    public boolean execute(Long actorId, Long targetUserId) {
        return userFollowRepository.findByFollowerAndFollowee(actorId, targetUserId).isPresent();
    }
}
