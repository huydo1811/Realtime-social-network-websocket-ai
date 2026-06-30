package com.social.pet.domain.entities;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.junit.jupiter.api.Test;

class PetTest {
    @Test
    void create_and_update_should_follow_owner_rules() {
        Pet pet = Pet.create(
                1L, "Meow", PetSpecies.CAT, "Mèo Ba Tư", PetGender.FEMALE,
                LocalDate.of(2022, 1, 1), new BigDecimal("4.5"),
                null, "Cute cat", null, PetVisibility.PUBLIC);

        pet.update(1L, "Meow Meow", PetSpecies.CAT, "Mèo Ba Tư", PetGender.FEMALE,
                LocalDate.of(2022, 1, 1), new BigDecimal("4.8"),
                "https://img.test/meow.png", "Updated bio", "CHIP-001",
                PetStatus.ACTIVE, PetVisibility.FRIENDS);

        assertEquals("Meow Meow", pet.getName());
        assertEquals(PetVisibility.FRIENDS, pet.getVisibility());

        assertThrows(IllegalStateException.class, () ->
                pet.update(2L, "Hacked", null, null, null, null, null, null, null, null, null, null));
    }

    @Test
    void create_should_reject_blank_name() {
        assertThrows(IllegalArgumentException.class, () ->
                Pet.create(1L, "  ", PetSpecies.DOG, null, null, null, null, null, null, null, null));
    }
}
