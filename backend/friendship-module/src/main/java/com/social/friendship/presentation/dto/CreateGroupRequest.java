package com.social.friendship.presentation.dto;

import com.social.friendship.domain.entities.GroupVisibility;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateGroupRequest {
    @NotBlank
    @Size(max = 120)
    private String name;
    private String description;
    private GroupVisibility visibility = GroupVisibility.PUBLIC;
    private boolean requireApproval = false;
    private boolean requirePostApproval = true;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public GroupVisibility getVisibility() {
        return visibility;
    }

    public void setVisibility(GroupVisibility visibility) {
        this.visibility = visibility;
    }

    public boolean isRequireApproval() {
        return requireApproval;
    }

    public void setRequireApproval(boolean requireApproval) {
        this.requireApproval = requireApproval;
    }

    public boolean isRequirePostApproval() {
        return requirePostApproval;
    }

    public void setRequirePostApproval(boolean requirePostApproval) {
        this.requirePostApproval = requirePostApproval;
    }
}
