package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.entities.Post;
import com.social.post.domain.entities.PostVisibility;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.PostRepository;

@Service
public class UpdatePostUseCase {
    private final PostRepository postRepository;

    public UpdatePostUseCase(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    @Transactional
    public Post execute(Long actorId, Long postId, String content, String mediaUrl, PostVisibility visibility) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new PostDomainException("Không tìm thấy bài viết"));
        post.update(actorId, content, mediaUrl, visibility);
        return postRepository.save(post);
    }
}
