package com.social.post.domain.repositories;

import com.social.post.domain.entities.PostShare;

public interface PostShareRepository {
    PostShare save(PostShare share);

    long countBySourcePostId(Long sourcePostId);
}
