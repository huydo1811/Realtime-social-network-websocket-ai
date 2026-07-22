package com.social.post.domain.repositories;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.social.post.domain.entities.Post;

public interface PostRepository {
    Post save(Post post);

    Optional<Post> findById(Long id);

    Page<Post> findByAuthorId(Long authorId, Pageable pageable);

    Page<Post> findFeed(Long actorId, Pageable pageable);

    Page<Post> findByPetId(Long petId, Pageable pageable);

    long countVisibleByPetId(Long petId, boolean ownerView, boolean friendView);

    long countVisibleByPetIdSince(Long petId, boolean ownerView, boolean friendView, java.time.LocalDateTime since);

    long countVisibleMediaByPetId(Long petId, boolean ownerView, boolean friendView);

    java.time.LocalDateTime latestVisibleCreatedAtByPetId(Long petId, boolean ownerView, boolean friendView);
}
