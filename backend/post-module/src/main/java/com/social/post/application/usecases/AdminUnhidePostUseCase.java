package com.social.post.application.usecases;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.entities.Post;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.PostRepository;

@Service
public class AdminUnhidePostUseCase {
    private final PostRepository postRepository;

    public AdminUnhidePostUseCase(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public Post execute(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new PostDomainException("Không tìm thấy bài viết"));
        post.unhideByAdmin();
        return postRepository.save(post);
    }
}
