package com.social.post.application.usecases;

import java.util.Objects;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.domain.entities.FriendshipStatus;
import com.social.friendship.domain.repositories.FriendshipRepository;
import com.social.pet.application.services.PetAccessService;
import com.social.pet.domain.entities.Pet;
import com.social.pet.domain.exceptions.PetDomainException;
import com.social.pet.domain.repositories.PetRepository;
import com.social.post.domain.entities.Post;
import com.social.post.domain.entities.PostStatus;
import com.social.post.domain.entities.PostVisibility;
import com.social.post.domain.repositories.PostRepository;
import com.social.user.domain.repositories.UserRepository;

@Service
public class ListPetPostsUseCase {
    private final PostRepository postRepository;
    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final PetAccessService petAccessService;

    public ListPetPostsUseCase(
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
    public Page<Post> execute(Long actorId, Long petId, Pageable pageable) {
        Pageable safePageable = Objects.requireNonNull(pageable, "pageable");
        userRepository.findById(actorId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new PetDomainException("Không tìm thấy thú cưng"));
        petAccessService.ensureCanView(actorId, pet);

        boolean isOwner = pet.isOwner(actorId);
        boolean isFriend = friendshipRepository.findByUsers(actorId, pet.getOwnerUserId())
                .map(f -> f.getStatus() == FriendshipStatus.ACCEPTED)
                .orElse(false);

        Page<Post> posts = postRepository.findByPetId(petId, safePageable);
        var visible = posts.getContent().stream().filter(post -> {
            if (post.getStatus() == PostStatus.DELETED) {
                return false;
            }
            if (isOwner) {
                return post.getStatus() != PostStatus.REJECTED;
            }
            if (post.getStatus() != PostStatus.APPROVED) {
                return false;
            }
            if (post.getVisibility() == PostVisibility.PUBLIC) {
                return true;
            }
            return post.getVisibility() == PostVisibility.FRIENDS && isFriend;
        }).toList();
        return new PageImpl<>(visible, safePageable, visible.size());
    }
}
