package com.social.friendship.presentation.dto;

public class RelationshipStatusResponse {
    private String status;
    private Long friendshipId;
    private Long requestedBy;
    private boolean canAccept;
    private boolean canCancel;
    private boolean canBlock;
    private boolean canUnblock;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getFriendshipId() {
        return friendshipId;
    }

    public void setFriendshipId(Long friendshipId) {
        this.friendshipId = friendshipId;
    }

    public Long getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(Long requestedBy) {
        this.requestedBy = requestedBy;
    }

    public boolean isCanAccept() {
        return canAccept;
    }

    public void setCanAccept(boolean canAccept) {
        this.canAccept = canAccept;
    }

    public boolean isCanCancel() {
        return canCancel;
    }

    public void setCanCancel(boolean canCancel) {
        this.canCancel = canCancel;
    }

    public boolean isCanBlock() {
        return canBlock;
    }

    public void setCanBlock(boolean canBlock) {
        this.canBlock = canBlock;
    }

    public boolean isCanUnblock() {
        return canUnblock;
    }

    public void setCanUnblock(boolean canUnblock) {
        this.canUnblock = canUnblock;
    }
}
