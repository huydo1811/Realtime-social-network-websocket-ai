package com.social.pet.infrastructure.repositories;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import com.social.pet.domain.entities.Pet;
import com.social.pet.domain.entities.PetSpecies;
import com.social.pet.domain.entities.PetStatus;
import com.social.pet.domain.repositories.PetRepository;

@Repository
public class PetRepositoryImpl implements PetRepository {
    private final JpaPetRepository jpaPetRepository;

    public PetRepositoryImpl(JpaPetRepository jpaPetRepository) {
        this.jpaPetRepository = jpaPetRepository;
    }

    @Override public Pet save(Pet pet) { return jpaPetRepository.save(pet); }

    @Override public Optional<Pet> findById(Long id) { return jpaPetRepository.findById(Objects.requireNonNull(id)); }

    @Override public void delete(Pet pet) { jpaPetRepository.delete(pet); }

    @Override public List<Pet> findByOwnerUserId(Long ownerUserId) { return jpaPetRepository.findByOwnerUserIdOrderByCreatedAtDesc(ownerUserId); }

    @Override public Page<Pet> findByOwnerUserId(Long ownerUserId, Pageable pageable) { return jpaPetRepository.findByOwnerUserIdOrderByCreatedAtDesc(ownerUserId, Objects.requireNonNull(pageable)); }

    @Override public Page<Pet> findAll(Pageable pageable) { return jpaPetRepository.findAllByOrderByCreatedAtDesc(Objects.requireNonNull(pageable)); }

    @Override public List<Pet> findByNameContainingIgnoreCase(String name) { return jpaPetRepository.findByNameContainingIgnoreCaseOrderByCreatedAtDesc(name, org.springframework.data.domain.PageRequest.of(0, 200)).getContent(); }

    @Override public Page<Pet> findByNameContainingIgnoreCase(String name, Pageable pageable) { return jpaPetRepository.findByNameContainingIgnoreCaseOrderByCreatedAtDesc(name, Objects.requireNonNull(pageable)); }

    @Override public long count() { return jpaPetRepository.count(); }

    @Override public long countByStatus(PetStatus status) { return jpaPetRepository.countByStatus(status); }

    @Override public List<Pet> findBySpecies(PetSpecies species) { return jpaPetRepository.findBySpecies(species); }
}
