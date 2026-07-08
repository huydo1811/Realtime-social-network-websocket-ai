package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.moderation.domain.entities.ModerationAudit.TargetType;
import com.social.post.application.services.PostModerationService;
import com.social.post.application.services.PostModerationService.Outcome;
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
    private final PostModerationService moderationService;

    public CreatePostUseCase(
            PostRepository postRepository,
            UserRepository userRepository,
            PostPetValidator postPetValidator,
            PostModerationService moderationService) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.postPetValidator = postPetValidator;
        this.moderationService = moderationService;
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

        Outcome outcome = moderationService.enforce(post.getContent());
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
            // audit failure must not roll back the user's post
        }
        return saved;
    }
}