package com.social.post.application.usecases;

import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.domain.entities.FriendshipStatus;
import com.social.friendship.domain.repositories.FriendshipRepository;
import com.social.post.domain.entities.Post;
import com.social.post.domain.entities.PostStatus;
import com.social.post.domain.entities.PostVisibility;
import com.social.post.domain.repositories.PostRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class ListUserPostsUseCase {
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;

    public ListUserPostsUseCase(
            PostRepository postRepository,
            UserRepository userRepository,
            FriendshipRepository friendshipRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.friendshipRepository = friendshipRepository;
    }

    @Transactional(readOnly = true)
    public Page<Post> execute(Long actorId, Long targetUserId, Pageable pageable) {
        Pageable safePageable = Objects.requireNonNull(pageable, "pageable");
        userRepository.findById(targetUserId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        Page<Post> allTargetPosts = postRepository.findByAuthorId(targetUserId, safePageable);
        if (actorId.equals(targetUserId)) {
            var ownerVisible = allTargetPosts.getContent().stream()
                    .filter(post -> post.getStatus() != PostStatus.REJECTED)
                    .toList();
            return new PageImpl<>(ownerVisible, safePageable, ownerVisible.size());
        }

        boolean isFriend = friendshipRepository.findByUsers(actorId, targetUserId)
                .map(f -> f.getStatus() == FriendshipStatus.ACCEPTED)
                .orElse(false);

        var visible = allTargetPosts.getContent().stream().filter(post -> {
            if (post.getStatus() != PostStatus.APPROVED) return false;
            if (post.getVisibility() == PostVisibility.PUBLIC) return true;
            return post.getVisibility() == PostVisibility.FRIENDS && isFriend;
        }).toList();
        return new PageImpl<>(visible, safePageable, visible.size());
    }
}
