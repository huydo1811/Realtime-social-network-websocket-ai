package com.social.pet.infrastructure.repositories;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.social.pet.domain.entities.PetHealthReminder;
import com.social.pet.domain.entities.PetReminderStatus;

public interface JpaPetHealthReminderRepository extends JpaRepository<PetHealthReminder, Long> {
    List<PetHealthReminder> findByPetIdOrderByDueDateDesc(Long petId);

    List<PetHealthReminder> findByPetIdAndStatusOrderByDueDateAsc(Long petId, PetReminderStatus status);

    @Query("""
            SELECT r FROM PetHealthReminder r
            JOIN Pet p ON p.id = r.petId
            WHERE p.ownerUserId = :ownerUserId
              AND r.status = :status
              AND r.dueDate >= :fromDate
            ORDER BY r.dueDate ASC
            """)
    List<PetHealthReminder> findUpcomingByOwnerUserId(
            @Param("ownerUserId") Long ownerUserId,
            @Param("fromDate") LocalDate fromDate,
            @Param("status") PetReminderStatus status);

    @Query("""
            SELECT r FROM PetHealthReminder r
            JOIN Pet p ON p.id = r.petId
            WHERE p.ownerUserId = :ownerUserId
              AND r.status = :status
              AND r.dueDate <= :today
            ORDER BY r.dueDate ASC
            """)
    List<PetHealthReminder> findDueByOwnerUserId(
            @Param("ownerUserId") Long ownerUserId,
            @Param("today") LocalDate today,
            @Param("status") PetReminderStatus status);

    Page<PetHealthReminder> findAllByOrderByDueDateDesc(Pageable pageable);

    @Query("""
            SELECT r FROM PetHealthReminder r
            JOIN Pet p ON p.id = r.petId
            WHERE p.ownerUserId = :ownerUserId
            """)
    Page<PetHealthReminder> findByOwnerUserId(@Param("ownerUserId") Long ownerUserId, Pageable pageable);

    long countByStatus(PetReminderStatus status);

    @Query("""
            SELECT COUNT(r) FROM PetHealthReminder r
            WHERE r.status = :status
              AND r.dueDate < :today
            """)
    long countOverdue(@Param("today") LocalDate today, @Param("status") PetReminderStatus status);
}
