package com.social.chat.presentation.dto;

public class BlockStatusResponse {
    private boolean blockedByMe;
    private boolean blockedMe;

    public boolean isBlockedByMe() {
        return blockedByMe;
    }

    public void setBlockedByMe(boolean blockedByMe) {
        this.blockedByMe = blockedByMe;
    }

    public boolean isBlockedMe() {
        return blockedMe;
    }

    public void setBlockedMe(boolean blockedMe) {
        this.blockedMe = blockedMe;
    }
}
