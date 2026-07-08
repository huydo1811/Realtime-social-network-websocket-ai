package com.social.pet.infrastructure.realtime;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonFormat;

public record PetWalkRealtimeEvent(
        String eventName,
        Long walkSessionId,
        Long meetupId,
        Long actorUserId,
        Long targetUserId,
        Long petId,
        String status,
        @JsonFormat(shape = JsonFormat.Shape.STRING)
        Instant createdAt
) {
    public static PetWalkRealtimeEvent of(
            String eventName,
            Long walkSessionId,
            Long meetupId,
            Long actorUserId,
            Long targetUserId,
            Long petId,
            String status
    ) {
        return new PetWalkRealtimeEvent(
                eventName,
                walkSessionId,
                meetupId,
                actorUserId,
                targetUserId,
                petId,
                status,
                Instant.now()
        );
    }
}
