package com.social.pet.domain.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "pet_breeds")
public class PetBreed {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "species", nullable = false, length = 50)
    private PetSpecies species;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    protected PetBreed() {
    }

    public Long getId() {
        return id;
    }

    public PetSpecies getSpecies() {
        return species;
    }

    public String getName() {
        return name;
    }
}
