package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.moderation.domain.entities.ModerationAudit.TargetType;
import com.social.post.application.services.PostModerationService;
import com.social.post.application.services.PostModerationService.Outcome;
import com.social.post.application.services.PostPetValidator;
import com.social.post.domain.entities.Post;
import com.social.post.domain.entities.PostVisibility;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.PostRepository;

@Service
public class UpdatePostUseCase {
    private final PostRepository postRepository;
    private final PostPetValidator postPetValidator;
    private final PostModerationService moderationService;

    public UpdatePostUseCase(
            PostRepository postRepository,
            PostPetValidator postPetValidator,
            PostModerationService moderationService) {
        this.postRepository = postRepository;
        this.postPetValidator = postPetValidator;
        this.moderationService = moderationService;
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
        moderationService.enforceMedia(mediaUrl);
        // Re-moderate on every edit so users cannot bypass the filter by editing later.
        Outcome outcome = moderationService.enforce(content);
        post.update(actorId, content, mediaUrl, visibility, petId);
        if (outcome.softHide()) {
            post.markPendingModeration();
        }
        Post saved = postRepository.save(post);
        try {
            moderationService.audit(
                    TargetType.POST,
                    saved.getId(),
                    actorId,
                    saved.getContent(),
                    outcome
            );
        } catch (Exception ignored) {
            // never break the user's update because of audit failure
        }
        return saved;
    }
}
