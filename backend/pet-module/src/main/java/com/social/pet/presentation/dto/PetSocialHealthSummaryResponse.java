package com.social.pet.presentation.dto;

public record PetSocialHealthSummaryResponse(
        long healthRecordCount,
        long reminderTotalCount,
        long reminderPendingCount,
        long reminderCompletedCount,
        long walkTotalCount,
        long walkFinishedCount,
        long walkActiveCount) {
}
