package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.entities.UserHiddenPost;
import com.social.post.domain.repositories.PostRepository;
import com.social.post.domain.repositories.UserHiddenPostRepository;

@Service
public class HidePostForUserUseCase {
    private final PostRepository postRepository;
    private final UserHiddenPostRepository userHiddenPostRepository;

    public HidePostForUserUseCase(
            PostRepository postRepository,
            UserHiddenPostRepository userHiddenPostRepository) {
        this.postRepository = postRepository;
        this.userHiddenPostRepository = userHiddenPostRepository;
    }

    @Transactional
    public void execute(Long userId, Long postId) {
        postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài viết"));
        if (userHiddenPostRepository.existsByUserIdAndPostId(userId, postId)) return;
        userHiddenPostRepository.save(UserHiddenPost.create(userId, postId));
    }
}
