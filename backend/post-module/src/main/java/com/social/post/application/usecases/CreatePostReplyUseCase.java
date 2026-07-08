package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.moderation.domain.entities.ModerationAudit.TargetType;
import com.social.post.application.services.PostModerationService;
import com.social.post.application.services.PostModerationService.Outcome;
import com.social.post.domain.entities.PostComment;
import com.social.post.domain.entities.PostStatus;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.PostCommentRepository;
import com.social.post.domain.repositories.PostRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class CreatePostReplyUseCase {
    private final PostRepository postRepository;
    private final PostCommentRepository postCommentRepository;
    private final UserRepository userRepository;
    private final PostModerationService moderationService;

    public CreatePostReplyUseCase(
            PostRepository postRepository,
            PostCommentRepository postCommentRepository,
            UserRepository userRepository,
            PostModerationService moderationService) {
        this.postRepository = postRepository;
        this.postCommentRepository = postCommentRepository;
        this.userRepository = userRepository;
        this.moderationService = moderationService;
    }

    @Transactional
    public PostComment execute(Long actorId, Long postId, Long parentCommentId, String content) {
        userRepository.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        var post = postRepository.findById(postId).orElseThrow(() -> new PostDomainException("Không tìm thấy bài viết"));
        if (post.getStatus() == PostStatus.DELETED) {
            throw new PostDomainException("Bài viết đã bị xóa");
        }
        var parent = postCommentRepository.findById(parentCommentId)
                .orElseThrow(() -> new PostDomainException("Không tìm thấy bình luận gốc"));
        if (!parent.getPostId().equals(postId)) {
            throw new PostDomainException("Bình luận không thuộc bài viết này");
        }
        PostComment reply = PostComment.createReply(postId, actorId, parentCommentId, content);

        Outcome outcome = moderationService.enforce(content);
        if (outcome.softHide()) {
            reply.hideByAdmin();
        }

        PostComment saved = postCommentRepository.save(reply);
        try {
            moderationService.audit(
                    TargetType.COMMENT,
                    saved.getId(),
                    actorId,
                    content,
                    outcome
            );
        } catch (Exception ignored) {
            // audit failure must not break the user's reply
        }
        return saved;
    }
}