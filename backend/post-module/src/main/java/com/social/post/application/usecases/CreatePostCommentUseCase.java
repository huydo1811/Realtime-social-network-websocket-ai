package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.entities.Post;
import com.social.post.domain.entities.PostComment;
import com.social.post.domain.entities.PostStatus;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.PostCommentRepository;
import com.social.post.domain.repositories.PostRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class CreatePostCommentUseCase {
    private final PostRepository postRepository;
    private final PostCommentRepository postCommentRepository;
    private final UserRepository userRepository;

    public CreatePostCommentUseCase(
            PostRepository postRepository,
            PostCommentRepository postCommentRepository,
            UserRepository userRepository) {
        this.postRepository = postRepository;
        this.postCommentRepository = postCommentRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public PostComment execute(Long actorId, Long postId, String content) {
        userRepository.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        Post post = postRepository.findById(postId).orElseThrow(() -> new PostDomainException("Không tìm thấy bài viết"));
        if (post.getStatus() == PostStatus.DELETED) {
            throw new PostDomainException("Bài viết đã bị xóa");
        }
        PostComment comment = PostComment.create(postId, actorId, content);
        return postCommentRepository.save(comment);
    }
}
