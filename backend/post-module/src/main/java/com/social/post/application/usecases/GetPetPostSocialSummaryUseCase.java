package com.social.post.application.usecases;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.domain.entities.FriendshipStatus;
import com.social.friendship.domain.repositories.FriendshipRepository;
import com.social.pet.application.services.PetAccessService;
import com.social.pet.domain.entities.Pet;
import com.social.pet.domain.exceptions.PetDomainException;
import com.social.pet.domain.repositories.PetRepository;
import com.social.post.domain.repositories.PostRepository;
import com.social.post.presentation.dto.PetPostSocialSummaryResponse;
import com.social.user.domain.repositories.UserRepository;

@Service
public class GetPetPostSocialSummaryUseCase {
    private final PostRepository postRepository;
    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final PetAccessService petAccessService;

    public GetPetPostSocialSummaryUseCase(
            PostRepository postRepository,
            PetRepository petRepository,
            UserRepository userRepository,
            FriendshipRepository friendshipRepository,
            PetAccessService petAccessService) {
        this.postRepository = postRepository;
        this.petRepository = petRepository;
        this.userRepository = userRepository;
        this.friendshipRepository = friendshipRepository;
        this.petAccessService = petAccessService;
    }

    @Transactional(readOnly = true)
    public PetPostSocialSummaryResponse execute(Long actorId, Long petId) {
        userRepository.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new PetDomainException("Không tìm thấy thú cưng"));
        petAccessService.ensureCanView(actorId, pet);

        boolean ownerView = pet.isOwner(actorId);
        boolean friendView = friendshipRepository.findByUsers(actorId, pet.getOwnerUserId())
                .map(f -> f.getStatus() == FriendshipStatus.ACCEPTED)
                .orElse(false);

        long total = postRepository.countVisibleByPetId(petId, ownerView, friendView);
        long recent7d = postRepository.countVisibleByPetIdSince(
                petId,
                ownerView,
                friendView,
                LocalDateTime.now().minusDays(7));
        long media = postRepository.countVisibleMediaByPetId(petId, ownerView, friendView);
        LocalDateTime latest = postRepository.latestVisibleCreatedAtByPetId(petId, ownerView, friendView);
        return new PetPostSocialSummaryResponse(
                total,
                recent7d,
                media,
                latest == null ? null : latest.toString());
    }
}
