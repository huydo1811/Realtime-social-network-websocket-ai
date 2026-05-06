package com.social.chat.infrastructure.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.social.chat.domain.entities.ChatConversation;

public interface JpaChatConversationRepository extends JpaRepository<ChatConversation, Long> {

    /**
     * Sắp xếp theo cuộc trò chuyện gần nhất:
     * - nếu có message: dùng MAX(chat_messages.created_at)
     * - nếu chưa có message: fallback chat_rooms.created_at
     */
    @Query(value = """
            SELECT cr.*
            FROM chat_rooms cr
            JOIN chat_room_members m ON m.room_id = cr.id AND m.user_id = :memberId
            LEFT JOIN (
                SELECT room_id, MAX(created_at) AS last_message_at
                FROM chat_messages
                GROUP BY room_id
            ) lm ON lm.room_id = cr.id
            ORDER BY COALESCE(lm.last_message_at, cr.created_at) DESC
            """, nativeQuery = true)
    List<ChatConversation> findByMemberId(@Param("memberId") Long memberId);

    @Query("select c from ChatConversation c join c.memberIds m where c.id = :conversationId and m = :memberId")
    Optional<ChatConversation> findByIdAndMemberId(@Param("conversationId") Long conversationId,
                                                   @Param("memberId") Long memberId);

    @Query(value = """
            SELECT cr.*
            FROM chat_rooms cr
            JOIN chat_room_members m1 ON m1.room_id = cr.id
            JOIN chat_room_members m2 ON m2.room_id = cr.id
            WHERE cr.type = 'PRIVATE'
              AND ((m1.user_id = :userA AND m2.user_id = :userB)
                   OR (m1.user_id = :userB AND m2.user_id = :userA))
            LIMIT 1
            """, nativeQuery = true)
    Optional<ChatConversation> findPrivateConversation(@Param("userA") Long userA,
                                                       @Param("userB") Long userB);

    @Query(value = """
            SELECT cr.*
            FROM chat_rooms cr
            JOIN chat_room_members m ON m.room_id = cr.id
            WHERE cr.type = 'PRIVATE'
              AND m.user_id = :userId
              AND (SELECT COUNT(*) FROM chat_room_members allm WHERE allm.room_id = cr.id) = 1
            LIMIT 1
            """, nativeQuery = true)
    Optional<ChatConversation> findSelfConversation(@Param("userId") Long userId);

    @Query("select c from ChatConversation c join c.memberIds m where m = :creatorId and c.idempotencyKey = :idempotencyKey")
    Optional<ChatConversation> findByIdempotencyKey(@Param("creatorId") Long creatorId,
                                                    @Param("idempotencyKey") String idempotencyKey);
}