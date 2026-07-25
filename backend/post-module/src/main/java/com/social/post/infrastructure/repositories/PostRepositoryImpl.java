package com.social.post.infrastructure.repositories;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import com.social.friendship.domain.entities.FriendshipStatus;
import com.social.friendship.domain.repositories.FriendshipRepository;
import com.social.friendship.domain.repositories.UserFollowRepository;
import com.social.post.domain.entities.Post;
import com.social.post.domain.repositories.PostRepository;

@Repository
public class PostRepositoryImpl implements PostRepository {
    private final JpaPostRepository jpaPostRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserFollowRepository userFollowRepository;

    public PostRepositoryImpl(
            JpaPostRepository jpaPostRepository,
            FriendshipRepository friendshipRepository,
            UserFollowRepository userFollowRepository) {
        this.jpaPostRepository = jpaPostRepository;
        this.friendshipRepository = friendshipRepository;
        this.userFollowRepository = userFollowRepository;
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
        List<Long> followingIds = userFollowRepository.findFolloweeIdsByFollowerUserId(actorId);
        Set<Long> networkIds = new LinkedHashSet<>();
        networkIds.addAll(friendIds);
        networkIds.addAll(followingIds);
        networkIds.add(actorId);
        List<Long> safeFriendIds = friendIds.isEmpty() ? List.of(-1L) : friendIds;
        return jpaPostRepository.findFeed(actorId, safeFriendIds, networkIds, pageable);
    }

    @Override
    public Page<Post> findByPetId(Long petId, Pageable pageable) {
        return jpaPostRepository.findByPetId(Objects.requireNonNull(petId), Objects.requireNonNull(pageable));
    }

    @Override
    public long countVisibleByPetId(Long petId, boolean ownerView, boolean friendView) {
        return jpaPostRepository.countVisibleByPetId(Objects.requireNonNull(petId), ownerView, friendView);
    }

    @Override
    public long countVisibleByPetIdSince(Long petId, boolean ownerView, boolean friendView, LocalDateTime since) {
        return jpaPostRepository.countVisibleByPetIdSince(
                Objects.requireNonNull(petId),
                ownerView,
                friendView,
                Objects.requireNonNull(since));
    }

    @Override
    public long countVisibleMediaByPetId(Long petId, boolean ownerView, boolean friendView) {
        return jpaPostRepository.countVisibleMediaByPetId(Objects.requireNonNull(petId), ownerView, friendView);
    }

    @Override
    public LocalDateTime latestVisibleCreatedAtByPetId(Long petId, boolean ownerView, boolean friendView) {
        return jpaPostRepository.latestVisibleCreatedAtByPetId(Objects.requireNonNull(petId), ownerView, friendView);
    }
}
