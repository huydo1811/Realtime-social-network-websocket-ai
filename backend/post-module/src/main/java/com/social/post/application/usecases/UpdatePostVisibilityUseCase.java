package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.entities.Post;
import com.social.post.domain.entities.PostVisibility;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.PostRepository;

@Service
public class UpdatePostVisibilityUseCase {
    private final PostRepository postRepository;

    public UpdatePostVisibilityUseCase(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    @Transactional
    public Post execute(Long actorId, Long postId, PostVisibility visibility) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new PostDomainException("Không tìm thấy bài viết"));
        post.updateVisibility(actorId, visibility);
        return postRepository.save(post);
    }
}
