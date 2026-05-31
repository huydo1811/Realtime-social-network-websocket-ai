package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.domain.entities.FriendshipStatus;
import com.social.friendship.domain.repositories.FriendshipRepository;
import com.social.post.domain.entities.Post;
import com.social.post.domain.entities.PostStatus;
import com.social.post.domain.entities.PostVisibility;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.PostRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class GetPostByIdUseCase {
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;

    public GetPostByIdUseCase(
            PostRepository postRepository,
            UserRepository userRepository,
            FriendshipRepository friendshipRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.friendshipRepository = friendshipRepository;
    }

    @Transactional(readOnly = true)
    public Post execute(Long actorId, Long postId) {
        userRepository.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new PostDomainException("Không tìm thấy bài viết"));
        if (post.getStatus() == PostStatus.DELETED) {
            throw new PostDomainException("Bài viết đã bị xóa");
        }
        if (post.getStatus() == PostStatus.REJECTED) {
            throw new PostDomainException("Bài viết đã bị ẩn bởi quản trị viên");
        }
        if (post.isVisibleToOwner(actorId)) {
            return post;
        }
        if (post.getStatus() != PostStatus.APPROVED) {
            throw new PostDomainException("Bạn không có quyền xem bài viết này");
        }
        if (post.getVisibility() == PostVisibility.PRIVATE) {
            throw new PostDomainException("Bạn không có quyền xem bài viết này");
        }
        if (post.getVisibility() == PostVisibility.FRIENDS) {
            boolean isFriend = friendshipRepository.findByUsers(actorId, post.getAuthorId())
                    .map(f -> f.getStatus() == FriendshipStatus.ACCEPTED)
                    .orElse(false);
            if (!isFriend) {
                throw new PostDomainException("Bạn không có quyền xem bài viết này");
            }
            boolean visible = postRepository.findFeed(actorId, org.springframework.data.domain.PageRequest.of(0, 100))
                    .stream()
                    .anyMatch(p -> p.getId().equals(post.getId()));
            if (!visible) {
                throw new PostDomainException("Bạn không có quyền xem bài viết này");
            }
        }
        return post;
    }
}
