package com.social.pet.application.usecases;

import java.util.List;

import org.springframework.stereotype.Service;

import com.social.pet.domain.entities.PetVisibility;
import com.social.pet.domain.entities.PetWalkSession;
import com.social.pet.domain.entities.PetWalkSessionStatus;
import com.social.pet.domain.repositories.PetWalkSessionRepository;

@Service
public class ListNearbyPetWalkSessionsUseCase {
    private final PetWalkSessionRepository walkSessionRepository;

    public ListNearbyPetWalkSessionsUseCase(PetWalkSessionRepository walkSessionRepository) {
        this.walkSessionRepository = walkSessionRepository;
    }

    public List<PetWalkSession> execute(Long actorId, Double latitude, Double longitude, Double radiusKm) {
        double radius = radiusKm == null ? 5.0 : radiusKm;
        return walkSessionRepository.findByStatusAndVisibilityOrderByStartedAtDesc(
                PetWalkSessionStatus.ACTIVE, PetVisibility.PUBLIC)
                .stream()
                .filter(session -> distanceKm(latitude, longitude, session.getCurrentLatitude(),
                        session.getCurrentLongitude()) <= radius)
                .filter(session -> !session.getCreatedByUserId().equals(actorId))
                .toList();
    }

    private static double distanceKm(Double leftLatitude, Double leftLongitude, Double rightLatitude,
            Double rightLongitude) {
        double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(rightLatitude - leftLatitude);
        double dLon = Math.toRadians(rightLongitude - leftLongitude);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(leftLatitude)) * Math.cos(Math.toRadians(rightLatitude))
                        * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }
}