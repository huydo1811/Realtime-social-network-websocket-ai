package com.social.post.domain.repositories;

import java.util.Set;

import com.social.post.domain.entities.UserHiddenPost;

public interface UserHiddenPostRepository {
    UserHiddenPost save(UserHiddenPost hiddenPost);

    boolean existsByUserIdAndPostId(Long userId, Long postId);

    Set<Long> findHiddenPostIdsByUserIdAndPostIds(Long userId, Set<Long> postIds);
}
