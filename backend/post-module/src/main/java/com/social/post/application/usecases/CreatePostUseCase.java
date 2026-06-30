package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.application.services.PostPetValidator;
import com.social.post.domain.entities.Post;
import com.social.post.domain.entities.PostVisibility;
import com.social.post.domain.repositories.PostRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class CreatePostUseCase {
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final PostPetValidator postPetValidator;

    public CreatePostUseCase(
            PostRepository postRepository,
            UserRepository userRepository,
            PostPetValidator postPetValidator) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.postPetValidator = postPetValidator;
    }

    @Transactional
    public Post execute(
            Long actorId,
            String content,
            String mediaUrl,
            PostVisibility visibility,
            Long petId) {
        userRepository.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        postPetValidator.validateOwnership(actorId, petId);
        Post post = Post.create(actorId, content, mediaUrl, visibility, petId);
        return postRepository.save(post);
    }
}
