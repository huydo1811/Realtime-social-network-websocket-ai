package com.social.friendship.infrastructure.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.social.friendship.domain.entities.GroupMemberReport;

public interface JpaGroupMemberReportRepository extends JpaRepository<GroupMemberReport, Long> {
    List<GroupMemberReport> findByGroupIdOrderByCreatedAtDesc(Long groupId);
}
