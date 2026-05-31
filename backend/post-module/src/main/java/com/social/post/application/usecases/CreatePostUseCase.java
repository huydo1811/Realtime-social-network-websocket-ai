package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.entities.Post;
import com.social.post.domain.entities.PostVisibility;
import com.social.post.domain.repositories.PostRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class CreatePostUseCase {
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public CreatePostUseCase(PostRepository postRepository, UserRepository userRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Post execute(Long actorId, String content, String mediaUrl, PostVisibility visibility) {
        userRepository.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        Post post = Post.create(actorId, content, mediaUrl, visibility);
        return postRepository.save(post);
    }
}
