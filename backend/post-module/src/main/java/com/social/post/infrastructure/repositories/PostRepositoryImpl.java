package com.social.post.infrastructure.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import com.social.friendship.domain.entities.FriendshipStatus;
import com.social.friendship.domain.repositories.FriendshipRepository;
import com.social.post.domain.entities.Post;
import com.social.post.domain.repositories.PostRepository;

@Repository
public class PostRepositoryImpl implements PostRepository {
    private final JpaPostRepository jpaPostRepository;
    private final FriendshipRepository friendshipRepository;

    public PostRepositoryImpl(JpaPostRepository jpaPostRepository, FriendshipRepository friendshipRepository) {
        this.jpaPostRepository = jpaPostRepository;
        this.friendshipRepository = friendshipRepository;
    }

    @Override
    public Post save(Post post) {
        return jpaPostRepository.save(post);
    }

    @Override
    public Optional<Post> findById(Long id) {
        return jpaPostRepository.findById(id);
    }

    @Override
    public Page<Post> findByAuthorId(Long authorId, Pageable pageable) {
        return jpaPostRepository.findByAuthorId(authorId, pageable);
    }

    @Override
    public Page<Post> findFeed(Long actorId, Pageable pageable) {
        List<Long> friendIds = friendshipRepository
                .findByUserIdAndStatuses(actorId, List.of(FriendshipStatus.ACCEPTED))
                .stream()
                .map(friendship -> friendship.getOtherUserId(actorId))
                .toList();
        return jpaPostRepository.findFeed(actorId, friendIds, pageable);
    }
}
