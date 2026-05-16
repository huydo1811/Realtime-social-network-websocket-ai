package com.social.friendship.domain.entities;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class FriendshipTest {

    @Test
    void shouldAcceptPendingRequestByReceiver() {
        Friendship friendship = Friendship.createPending(1L, 2L);
        friendship.accept(2L);
        assertEquals(FriendshipStatus.ACCEPTED, friendship.getStatus());
    }

    @Test
    void shouldRejectWhenRequesterAcceptsOwnRequest() {
        Friendship friendship = Friendship.createPending(1L, 2L);
        assertThrows(IllegalStateException.class, () -> friendship.accept(1L));
    }

    @Test
    void shouldAllowBlockAndUnblockByBlocker() {
        Friendship friendship = Friendship.createPending(1L, 2L);
        friendship.block(2L);
        assertEquals(FriendshipStatus.BLOCKED, friendship.getStatus());
        friendship.unblock(2L);
    }
}
