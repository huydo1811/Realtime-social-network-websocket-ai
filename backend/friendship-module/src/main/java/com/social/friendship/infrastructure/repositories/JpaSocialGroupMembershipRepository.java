package com.social.friendship.infrastructure.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.friendship.domain.entities.GroupMembershipStatus;
import com.social.friendship.domain.entities.SocialGroupMembership;

public interface JpaSocialGroupMembershipRepository extends JpaRepository<SocialGroupMembership, Long> {
    Optional<SocialGroupMembership> findByGroupIdAndUserId(Long groupId, Long userId);

    List<SocialGroupMembership> findByGroupIdAndStatusOrderByRequestedAtDesc(Long groupId, GroupMembershipStatus status);

    List<SocialGroupMembership> findByGroupIdOrderByRequestedAtDesc(Long groupId);

    List<SocialGroupMembership> findByUserIdAndStatusOrderByRequestedAtDesc(Long userId, GroupMembershipStatus status);

    List<SocialGroupMembership> findByUserIdOrderByRequestedAtDesc(Long userId);

    long countByGroupId(Long groupId);

    long countByGroupIdAndStatus(Long groupId, GroupMembershipStatus status);

    void deleteByGroupId(Long groupId);
}
