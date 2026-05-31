package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.entities.Post;
import com.social.post.domain.entities.PostShare;
import com.social.post.domain.entities.PostStatus;
import com.social.post.domain.entities.PostVisibility;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.PostRepository;
import com.social.post.domain.repositories.PostShareRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class SharePostUseCase {
    private final PostRepository postRepository;
    private final PostShareRepository postShareRepository;
    private final UserRepository userRepository;

    public SharePostUseCase(
            PostRepository postRepository,
            PostShareRepository postShareRepository,
            UserRepository userRepository) {
        this.postRepository = postRepository;
        this.postShareRepository = postShareRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Post execute(Long actorId, Long sourcePostId, String content, PostVisibility visibility) {
        userRepository.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        Post source = postRepository.findById(sourcePostId).orElseThrow(() -> new PostDomainException("Không tìm thấy bài viết"));
        if (source.getStatus() == PostStatus.DELETED) {
            throw new PostDomainException("Không thể chia sẻ bài viết đã xóa");
        }

        Post shared = Post.createShared(actorId, sourcePostId, content, visibility == null ? PostVisibility.PUBLIC : visibility);
        Post saved = postRepository.save(shared);
        postShareRepository.save(PostShare.create(sourcePostId, saved.getId(), actorId));
        return saved;
    }
}
