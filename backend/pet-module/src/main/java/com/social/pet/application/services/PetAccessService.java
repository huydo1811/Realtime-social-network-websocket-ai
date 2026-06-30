package com.social.pet.application.services;

import org.springframework.stereotype.Service;

import com.social.friendship.domain.entities.FriendshipStatus;
import com.social.friendship.domain.repositories.FriendshipRepository;
import com.social.pet.domain.entities.Pet;
import com.social.pet.domain.exceptions.PetDomainException;

@Service
public class PetAccessService {
    private final FriendshipRepository friendshipRepository;

    public PetAccessService(FriendshipRepository friendshipRepository) {
        this.friendshipRepository = friendshipRepository;
    }

    public void ensureCanView(Long actorId, Pet pet) {
        if (pet.isVisibleTo(actorId, isFriend(actorId, pet.getOwnerUserId()))) {
            return;
        }
        throw new PetDomainException("Bạn không có quyền xem hồ sơ thú cưng này");
    }

    public boolean canView(Long actorId, Pet pet) {
        return pet.isVisibleTo(actorId, isFriend(actorId, pet.getOwnerUserId()));
    }

    private boolean isFriend(Long actorId, Long ownerUserId) {
        if (actorId.equals(ownerUserId)) {
            return true;
        }
        return friendshipRepository.findByUsers(actorId, ownerUserId)
                .map(f -> f.getStatus() == FriendshipStatus.ACCEPTED)
                .orElse(false);
    }
}
