package com.social.chat.infrastructure.repositories;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.social.chat.domain.entities.ChatMessage;

public interface JpaChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("select m from ChatMessage m where m.conversation.id = :conversationId order by m.createdAt desc")
    Page<ChatMessage> findByConversationId(@Param("conversationId") Long conversationId, Pageable pageable);

    @Query("select m from ChatMessage m where m.conversation.id = :conversationId and (:cursorId is null or m.id < :cursorId) order by m.id desc")
    Page<ChatMessage> findByConversationIdWithCursor(@Param("conversationId") Long conversationId, @Param("cursorId") Long cursorId, Pageable pageable);

    @Query("select m from ChatMessage m where m.conversation.id = :conversationId and m.senderId = :senderId and m.idempotencyKey = :idempotencyKey")
    Optional<ChatMessage> findByIdempotencyKey(@Param("conversationId") Long conversationId,
                                               @Param("senderId") Long senderId,
                                               @Param("idempotencyKey") String idempotencyKey);

    @Query("select m.conversation.id, count(m) from ChatMessage m where m.conversation.id in :conversationIds and m.senderId != :actorId and m.isRead = false group by m.conversation.id")
    java.util.List<Object[]> countUnreadMessagesByConversationIds(@Param("conversationIds") java.util.Collection<Long> conversationIds, @Param("actorId") Long actorId);
}
