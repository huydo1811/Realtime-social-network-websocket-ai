package com.social.moderation.domain.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.social.moderation.domain.entities.ModerationModelVersion;
import com.social.moderation.domain.entities.ModerationModelVersion.ModelType;

public interface ModerationModelVersionRepository extends JpaRepository<ModerationModelVersion, Long> {
    List<ModerationModelVersion> findAllByOrderByCreatedAtDesc();

    Optional<ModerationModelVersion> findByModelTypeAndActiveTrue(ModelType modelType);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ModerationModelVersion m SET m.active = false WHERE m.modelType = :type AND m.active = true")
    void deactivateAllOfType(@Param("type") ModelType type);
}
