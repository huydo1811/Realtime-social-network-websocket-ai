package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.entities.PostComment;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.PostCommentRepository;

@Service
public class AdminHideCommentUseCase {
    private final PostCommentRepository postCommentRepository;

    public AdminHideCommentUseCase(PostCommentRepository postCommentRepository) {
        this.postCommentRepository = postCommentRepository;
    }

    @Transactional
    public PostComment execute(Long commentId) {
        PostComment comment = postCommentRepository.findById(commentId)
                .orElseThrow(() -> new PostDomainException("Không tìm thấy bình luận"));
        comment.hideByAdmin();
        return postCommentRepository.save(comment);
    }
}
