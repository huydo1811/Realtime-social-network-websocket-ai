package com.social.friendship.presentation.mapper;

import org.springframework.stereotype.Component;

import com.social.friendship.domain.entities.Friendship;
import com.social.friendship.domain.entities.FriendshipStatus;
import com.social.friendship.presentation.dto.FriendshipResponse;
import com.social.friendship.presentation.dto.RelationshipStatusResponse;

@Component
public class FriendshipMapper {

    public FriendshipResponse toResponse(Friendship friendship) {
        FriendshipResponse response = new FriendshipResponse();
        response.setFriendshipId(friendship.getId());
        response.setUserId1(friendship.getUserId1());
        response.setUserId2(friendship.getUserId2());
        response.setRequestedBy(friendship.getRequestedBy());
        response.setStatus(friendship.getStatus().name());
        response.setCreatedAt(friendship.getCreatedAt());
        response.setUpdatedAt(friendship.getUpdatedAt());
        return response;
    }

    public RelationshipStatusResponse toStatusResponse(Long actorId, Long targetId, Friendship friendship) {
        RelationshipStatusResponse response = new RelationshipStatusResponse();
        if (friendship == null) {
            response.setStatus("NONE");
            response.setCanBlock(true);
            return response;
        }
        response.setStatus(friendship.getStatus().name());
        response.setFriendshipId(friendship.getId());
        response.setRequestedBy(friendship.getRequestedBy());

        if (friendship.getStatus() == FriendshipStatus.PENDING) {
            boolean isRequester = friendship.getRequestedBy().equals(actorId);
            response.setCanAccept(!isRequester);
            response.setCanCancel(isRequester);
            response.setCanBlock(true);
        } else if (friendship.getStatus() == FriendshipStatus.ACCEPTED) {
            response.setCanBlock(true);
        } else if (friendship.getStatus() == FriendshipStatus.BLOCKED) {
            boolean blockedByMe = friendship.getRequestedBy().equals(actorId);
            response.setCanUnblock(blockedByMe);
        } else {
            response.setCanBlock(true);
        }
        return response;
    }
}
