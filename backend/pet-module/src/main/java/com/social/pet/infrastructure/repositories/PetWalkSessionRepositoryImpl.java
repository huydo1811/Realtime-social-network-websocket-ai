package com.social.pet.infrastructure.repositories;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import com.social.pet.domain.entities.PetVisibility;
import com.social.pet.domain.entities.PetWalkSession;
import com.social.pet.domain.entities.PetWalkSessionStatus;
import com.social.pet.domain.repositories.PetWalkSessionRepository;

@Repository
public class PetWalkSessionRepositoryImpl implements PetWalkSessionRepository {
    private final JpaPetWalkSessionRepository jpaRepository;

    public PetWalkSessionRepositoryImpl(JpaPetWalkSessionRepository jpaRepository) { this.jpaRepository = jpaRepository; }

    @Override public PetWalkSession save(PetWalkSession session) { return jpaRepository.save(session); }

    @Override public Optional<PetWalkSession> findById(Long id) { return jpaRepository.findById(Objects.requireNonNull(id)); }

    @Override public List<PetWalkSession> findByPetIdOrderByStartedAtDesc(Long petId) { return jpaRepository.findByPetIdOrderByStartedAtDesc(Objects.requireNonNull(petId)); }

    @Override public List<PetWalkSession> findByStatusAndVisibilityOrderByStartedAtDesc(PetWalkSessionStatus status, PetVisibility visibility) { return jpaRepository.findByStatusAndVisibilityOrderByStartedAtDesc(status, visibility); }

    @Override public Page<PetWalkSession> findAll(Pageable pageable) { return jpaRepository.findAllByOrderByStartedAtDesc(Objects.requireNonNull(pageable)); }

    @Override public Page<PetWalkSession> findByOwnerUserId(Long ownerUserId, Pageable pageable) { return jpaRepository.findByOwnerUserId(Objects.requireNonNull(ownerUserId), Objects.requireNonNull(pageable)); }

    @Override public long count() { return jpaRepository.count(); }
}