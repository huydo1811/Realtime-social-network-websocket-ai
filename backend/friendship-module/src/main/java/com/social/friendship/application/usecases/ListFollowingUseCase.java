package com.social.friendship.application.usecases;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.domain.entities.UserFollow;
import com.social.friendship.domain.repositories.UserFollowRepository;

@Service
public class ListFollowingUseCase {
    private final UserFollowRepository userFollowRepository;

    public ListFollowingUseCase(UserFollowRepository userFollowRepository) {
        this.userFollowRepository = userFollowRepository;
    }

    @Transactional(readOnly = true)
    public List<UserFollow> execute(Long actorId) {
        return userFollowRepository.findByFollowerUserId(actorId);
    }
}
