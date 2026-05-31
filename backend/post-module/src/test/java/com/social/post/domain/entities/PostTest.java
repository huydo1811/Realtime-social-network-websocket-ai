package com.social.post.domain.entities;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class PostTest {
    @Test
    void create_and_update_and_delete_should_follow_owner_rules() {
        Post post = Post.create(1L, "hello", null, PostVisibility.PUBLIC);

        post.update(1L, "updated", "https://img.test/x.png", PostVisibility.FRIENDS);
        assertEquals("updated", post.getContent());
        assertEquals(PostVisibility.FRIENDS, post.getVisibility());

        assertThrows(IllegalStateException.class, () -> post.update(2L, "x", null, PostVisibility.PUBLIC));

        post.delete(1L);
        assertEquals(PostStatus.DELETED, post.getStatus());
    }

    @Test
    void create_should_reject_blank_content() {
        assertThrows(IllegalArgumentException.class, () -> Post.create(1L, "   ", null, PostVisibility.PUBLIC));
    }
}
