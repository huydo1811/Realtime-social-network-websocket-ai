package com.social.post.application.usecases;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.entities.PostLike;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.PostLikeRepository;
import com.social.post.domain.repositories.PostRepository;

@Service
public class ListPostLikersUseCase {
    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;

    public ListPostLikersUseCase(PostRepository postRepository, PostLikeRepository postLikeRepository) {
        this.postRepository = postRepository;
        this.postLikeRepository = postLikeRepository;
    }

    @Transactional(readOnly = true)
    public List<PostLike> execute(Long postId) {
        postRepository.findById(postId)
                .orElseThrow(() -> new PostDomainException("Không tìm thấy bài viết"));
        return postLikeRepository.findByPostIdOrderByCreatedAtDesc(postId);
    }
}
