package com.social.friendship.infrastructure.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.friendship.domain.entities.GroupPostStatus;
import com.social.friendship.domain.entities.SocialGroupPost;

public interface JpaSocialGroupPostRepository extends JpaRepository<SocialGroupPost, Long> {
    List<SocialGroupPost> findByGroupIdAndStatusOrderByCreatedAtDesc(Long groupId, GroupPostStatus status);

    List<SocialGroupPost> findByGroupIdAndAuthorUserIdAndStatusOrderByCreatedAtDesc(
            Long groupId, Long authorUserId, GroupPostStatus status);

    List<SocialGroupPost> findByGroupIdOrderByCreatedAtDesc(Long groupId);

    List<SocialGroupPost> findTop100ByGroupIdInAndStatusOrderByCreatedAtDesc(List<Long> groupIds, GroupPostStatus status);

    long countByGroupId(Long groupId);

    long countByGroupIdAndStatus(Long groupId, GroupPostStatus status);

    void deleteByGroupId(Long groupId);
}
