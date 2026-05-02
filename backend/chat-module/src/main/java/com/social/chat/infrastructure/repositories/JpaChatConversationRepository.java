package com.social.chat.infrastructure.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.social.chat.domain.entities.ChatConversation;

public interface JpaChatConversationRepository extends JpaRepository<ChatConversation, Long> {

    @Query("select distinct c from ChatConversation c join c.memberIds m where m = :memberId order by c.createdAt desc")
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

    @Query("select c from ChatConversation c join c.memberIds m where m = :creatorId and c.idempotencyKey = :idempotencyKey")
    Optional<ChatConversation> findByIdempotencyKey(@Param("creatorId") Long creatorId, 
                                                    @Param("idempotencyKey") String idempotencyKey);
}
