package com.social.post.application.usecases;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.entities.PostComment;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.PostCommentRepository;
import com.social.post.domain.repositories.PostRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class ListPostCommentsUseCase {
    private final PostRepository postRepository;
    private final PostCommentRepository postCommentRepository;
    private final UserRepository userRepository;

    public ListPostCommentsUseCase(
            PostRepository postRepository,
            PostCommentRepository postCommentRepository,
            UserRepository userRepository) {
        this.postRepository = postRepository;
        this.postCommentRepository = postCommentRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<PostComment> execute(Long actorId, Long postId) {
        userRepository.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        postRepository.findById(postId).orElseThrow(() -> new PostDomainException("Không tìm thấy bài viết"));
        return postCommentRepository.findByPostIdOrderByCreatedAtAsc(postId);
    }
}
