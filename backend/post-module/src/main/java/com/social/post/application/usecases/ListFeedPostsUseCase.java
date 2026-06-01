package com.social.post.application.usecases;

import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.entities.Post;
import com.social.post.domain.repositories.PostRepository;
import com.social.post.domain.repositories.UserHiddenPostRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class ListFeedPostsUseCase {
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final UserHiddenPostRepository userHiddenPostRepository;

    public ListFeedPostsUseCase(
            PostRepository postRepository,
            UserRepository userRepository,
            UserHiddenPostRepository userHiddenPostRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.userHiddenPostRepository = userHiddenPostRepository;
    }

    @Transactional(readOnly = true)
    public Page<Post> execute(Long actorId, Pageable pageable) {
        Pageable safePageable = Objects.requireNonNull(pageable, "pageable");
        userRepository.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        Page<Post> raw = postRepository.findFeed(actorId, safePageable);
        var ids = raw.getContent().stream().map(Post::getId).collect(java.util.stream.Collectors.toSet());
        var hidden = userHiddenPostRepository.findHiddenPostIdsByUserIdAndPostIds(actorId, ids);
        var visible = raw.getContent().stream()
                .filter(post -> !hidden.contains(post.getId()))
                .toList();
        return new PageImpl<>(visible, safePageable, visible.size());
    }
}
