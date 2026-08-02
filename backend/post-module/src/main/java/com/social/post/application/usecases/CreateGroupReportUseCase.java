package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.infrastructure.repositories.JpaSocialGroupRepository;
import com.social.post.domain.entities.ContentReport;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.ContentReportRepository;

@Service
public class CreateGroupReportUseCase {
    private final JpaSocialGroupRepository groupRepository;
    private final ContentReportRepository contentReportRepository;

    public CreateGroupReportUseCase(
            JpaSocialGroupRepository groupRepository,
            ContentReportRepository contentReportRepository) {
        this.groupRepository = groupRepository;
        this.contentReportRepository = contentReportRepository;
    }

    @Transactional
    public ContentReport execute(Long actorId, Long groupId, String reason) {
        var group = groupRepository.findById(groupId)
                .orElseThrow(() -> new PostDomainException("Không tìm thấy nhóm"));
        if (group.getOwnerUserId().equals(actorId)) {
            throw new PostDomainException("Không thể tự báo cáo nhóm của chính mình");
        }
        return contentReportRepository.save(ContentReport.createGroupReport(actorId, groupId, reason));
    }
}
