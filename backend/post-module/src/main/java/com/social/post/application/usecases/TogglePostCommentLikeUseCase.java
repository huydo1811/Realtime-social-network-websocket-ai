package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.entities.PostCommentLike;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.PostCommentLikeRepository;
import com.social.post.domain.repositories.PostCommentRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class TogglePostCommentLikeUseCase {
    private final PostCommentRepository postCommentRepository;
    private final PostCommentLikeRepository postCommentLikeRepository;
    private final UserRepository userRepository;

    public TogglePostCommentLikeUseCase(
            PostCommentRepository postCommentRepository,
            PostCommentLikeRepository postCommentLikeRepository,
            UserRepository userRepository) {
        this.postCommentRepository = postCommentRepository;
        this.postCommentLikeRepository = postCommentLikeRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public long execute(Long actorId, Long commentId) {
        userRepository.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        postCommentRepository.findById(commentId).orElseThrow(() -> new PostDomainException("Không tìm thấy bình luận"));
        postCommentLikeRepository.findByCommentIdAndUserId(commentId, actorId).ifPresentOrElse(
                postCommentLikeRepository::delete,
                () -> postCommentLikeRepository.save(PostCommentLike.create(commentId, actorId)));
        return postCommentLikeRepository.countByCommentId(commentId);
    }
}
