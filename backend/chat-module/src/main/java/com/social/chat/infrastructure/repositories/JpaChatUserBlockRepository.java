package com.social.chat.infrastructure.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.social.chat.domain.entities.ChatUserBlock;
import com.social.chat.domain.entities.ChatUserBlock.ChatUserBlockId;

public interface JpaChatUserBlockRepository extends JpaRepository<ChatUserBlock, ChatUserBlockId> {
    @Modifying
    @Transactional
    @Query("DELETE FROM ChatUserBlock b WHERE b.blockerId = :blockerId AND b.blockedId = :blockedId")
    void deleteByBlockerIdAndBlockedId(@Param("blockerId") Long blockerId, @Param("blockedId") Long blockedId);

    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    List<ChatUserBlock> findByBlockerId(Long blockerId);
}
