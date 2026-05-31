package com.social.post.application.usecases;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.entities.Post;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.PostRepository;

@Service
public class AdminHidePostUseCase {
    private final PostRepository postRepository;

    public AdminHidePostUseCase(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public Post execute(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new PostDomainException("Không tìm thấy bài viết"));
        post.hideByAdmin();
        return postRepository.save(post);
    }
}
