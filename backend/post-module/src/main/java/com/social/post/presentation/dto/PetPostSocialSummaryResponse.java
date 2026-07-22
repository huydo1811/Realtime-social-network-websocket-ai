package com.social.post.presentation.dto;

public record PetPostSocialSummaryResponse(
        long totalPostCount,
        long recentPost7dCount,
        long mediaPostCount,
        String latestPostAt) {
}
