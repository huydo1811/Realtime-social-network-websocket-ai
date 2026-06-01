package com.social.post.infrastructure.repositories;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.social.post.domain.entities.UserHiddenPost;

public interface JpaUserHiddenPostRepository extends JpaRepository<UserHiddenPost, Long> {
    boolean existsByUserIdAndPostId(Long userId, Long postId);

    @Query("SELECT u.postId FROM UserHiddenPost u WHERE u.userId = :userId AND u.postId IN :postIds")
    List<Long> findPostIdsByUserIdAndPostIds(@Param("userId") Long userId, @Param("postIds") Collection<Long> postIds);
}
