package com.social.friendship.infrastructure.repositories;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.social.friendship.domain.entities.GroupVisibility;
import com.social.friendship.domain.entities.SocialGroup;

public interface JpaSocialGroupRepository extends JpaRepository<SocialGroup, Long> {
    List<SocialGroup> findByOwnerUserIdOrderByCreatedAtDesc(Long ownerUserId);

    @Query("""
            SELECT g FROM SocialGroup g
            WHERE (:query IS NULL OR :query = '' OR LOWER(g.name) LIKE LOWER(CONCAT('%', :query, '%')))
              AND (:visibility IS NULL OR g.visibility = :visibility)
            ORDER BY g.createdAt DESC
            """)
    List<SocialGroup> search(@Param("query") String query, @Param("visibility") GroupVisibility visibility);

    @Query("""
            SELECT g FROM SocialGroup g
            WHERE (:query IS NULL OR :query = '' OR LOWER(g.name) LIKE LOWER(CONCAT('%', :query, '%')))
              AND (:visibility IS NULL OR g.visibility = :visibility)
              AND (:ownerUserId IS NULL OR g.ownerUserId = :ownerUserId)
            """)
    Page<SocialGroup> searchAdmin(
            @Param("query") String query,
            @Param("visibility") GroupVisibility visibility,
            @Param("ownerUserId") Long ownerUserId,
            Pageable pageable);
}
