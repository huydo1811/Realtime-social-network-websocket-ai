package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.entities.Post;
import com.social.post.domain.entities.PostLike;
import com.social.post.domain.entities.PostStatus;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.PostLikeRepository;
import com.social.post.domain.repositories.PostRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class TogglePostLikeUseCase {
    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final UserRepository userRepository;

    public TogglePostLikeUseCase(
            PostRepository postRepository,
            PostLikeRepository postLikeRepository,
            UserRepository userRepository) {
        this.postRepository = postRepository;
        this.postLikeRepository = postLikeRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public long execute(Long actorId, Long postId) {
        userRepository.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        Post post = postRepository.findById(postId).orElseThrow(() -> new PostDomainException("Không tìm thấy bài viết"));
        if (post.getStatus() == PostStatus.DELETED) {
            throw new PostDomainException("Bài viết đã bị xóa");
        }

        postLikeRepository.findByPostIdAndUserId(postId, actorId).ifPresentOrElse(
                postLikeRepository::delete,
                () -> postLikeRepository.save(PostLike.create(postId, actorId)));
        return postLikeRepository.countByPostId(postId);
    }
}
