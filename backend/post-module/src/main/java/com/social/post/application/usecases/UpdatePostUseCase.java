package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.application.services.PostPetValidator;
import com.social.post.domain.entities.Post;
import com.social.post.domain.entities.PostVisibility;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.PostRepository;

@Service
public class UpdatePostUseCase {
    private final PostRepository postRepository;
    private final PostPetValidator postPetValidator;

    public UpdatePostUseCase(PostRepository postRepository, PostPetValidator postPetValidator) {
        this.postRepository = postRepository;
        this.postPetValidator = postPetValidator;
    }

    @Transactional
    public Post execute(
            Long actorId,
            Long postId,
            String content,
            String mediaUrl,
            PostVisibility visibility,
            Long petId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new PostDomainException("Không tìm thấy bài viết"));
        postPetValidator.validateOwnership(actorId, petId);
        post.update(actorId, content, mediaUrl, visibility, petId);
        return postRepository.save(post);
    }
}
