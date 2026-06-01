package com.social.post.infrastructure.repositories;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Repository;

import com.social.post.domain.entities.UserHiddenPost;
import com.social.post.domain.repositories.UserHiddenPostRepository;

@Repository
public class UserHiddenPostRepositoryImpl implements UserHiddenPostRepository {
    private final JpaUserHiddenPostRepository jpaUserHiddenPostRepository;

    public UserHiddenPostRepositoryImpl(JpaUserHiddenPostRepository jpaUserHiddenPostRepository) {
        this.jpaUserHiddenPostRepository = jpaUserHiddenPostRepository;
    }

    @Override
    public UserHiddenPost save(UserHiddenPost hiddenPost) {
        return jpaUserHiddenPostRepository.save(hiddenPost);
    }

    @Override
    public boolean existsByUserIdAndPostId(Long userId, Long postId) {
        return jpaUserHiddenPostRepository.existsByUserIdAndPostId(userId, postId);
    }

    @Override
    public Set<Long> findHiddenPostIdsByUserIdAndPostIds(Long userId, Set<Long> postIds) {
        if (postIds == null || postIds.isEmpty()) return Collections.emptySet();
        return jpaUserHiddenPostRepository.findPostIdsByUserIdAndPostIds(userId, postIds)
                .stream()
                .collect(Collectors.toSet());
    }
}
