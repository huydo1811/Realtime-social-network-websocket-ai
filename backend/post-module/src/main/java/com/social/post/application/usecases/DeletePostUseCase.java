package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.entities.Post;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.PostRepository;

@Service
public class DeletePostUseCase {
    private final PostRepository postRepository;

    public DeletePostUseCase(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    @Transactional
    public void execute(Long actorId, Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new PostDomainException("Không tìm thấy bài viết"));
        post.delete(actorId);
        postRepository.save(post);
    }
}
