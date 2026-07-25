package com.social.friendship.application.usecases;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.domain.entities.FriendshipStatus;
import com.social.friendship.domain.repositories.FriendshipRepository;
import com.social.friendship.domain.repositories.UserFollowRepository;
import com.social.user.domain.entities.User;
import com.social.user.domain.repositories.UserRepository;

@Service
public class ListFollowSuggestionsUseCase {
    private final UserRepository userRepository;
    private final UserFollowRepository userFollowRepository;
    private final FriendshipRepository friendshipRepository;

    public ListFollowSuggestionsUseCase(
            UserRepository userRepository,
            UserFollowRepository userFollowRepository,
            FriendshipRepository friendshipRepository) {
        this.userRepository = userRepository;
        this.userFollowRepository = userFollowRepository;
        this.friendshipRepository = friendshipRepository;
    }

    @Transactional(readOnly = true)
    public List<User> execute(Long actorId, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 30);
        Set<Long> followed = userFollowRepository.findFolloweeIdsByFollowerUserId(actorId).stream().collect(Collectors.toSet());
        Set<Long> friends = friendshipRepository
                .findByUserIdAndStatuses(actorId, List.of(FriendshipStatus.ACCEPTED))
                .stream()
                .map(row -> row.getOtherUserId(actorId))
                .collect(Collectors.toSet());
        followed.add(actorId);
        followed.addAll(friends);

        return userRepository.findAll().stream()
                .filter(Objects::nonNull)
                .filter(user -> user.getId() != null)
                .filter(user -> !followed.contains(user.getId()))
                .filter(user -> Boolean.TRUE.equals(user.getIsActive()))
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(safeLimit)
                .toList();
    }
}
