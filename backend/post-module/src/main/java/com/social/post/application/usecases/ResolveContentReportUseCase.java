package com.social.post.application.usecases;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.friendship.infrastructure.repositories.JpaSocialGroupMembershipRepository;
import com.social.friendship.infrastructure.repositories.JpaSocialGroupPostRepository;
import com.social.friendship.infrastructure.repositories.JpaSocialGroupRepository;
import com.social.post.domain.entities.ContentReport;
import com.social.post.domain.entities.ReportTargetType;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.ContentReportRepository;
import com.social.post.domain.repositories.PostCommentRepository;
import com.social.post.domain.repositories.PostRepository;

@Service
public class ResolveContentReportUseCase {
    private final ContentReportRepository contentReportRepository;
    private final PostRepository postRepository;
    private final PostCommentRepository postCommentRepository;
    private final JpaSocialGroupRepository groupRepository;
    private final JpaSocialGroupMembershipRepository groupMembershipRepository;
    private final JpaSocialGroupPostRepository groupPostRepository;

    public ResolveContentReportUseCase(
            ContentReportRepository contentReportRepository,
            PostRepository postRepository,
            PostCommentRepository postCommentRepository,
            JpaSocialGroupRepository groupRepository,
            JpaSocialGroupMembershipRepository groupMembershipRepository,
            JpaSocialGroupPostRepository groupPostRepository) {
        this.contentReportRepository = contentReportRepository;
        this.postRepository = postRepository;
        this.postCommentRepository = postCommentRepository;
        this.groupRepository = groupRepository;
        this.groupMembershipRepository = groupMembershipRepository;
        this.groupPostRepository = groupPostRepository;
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ContentReport resolve(Long reportId, Long adminUserId, String note, boolean accept) {
        ContentReport report = contentReportRepository.findById(reportId)
                .orElseThrow(() -> new PostDomainException("Không tìm thấy báo cáo"));
        if (accept) {
            if (report.getTargetType() == ReportTargetType.POST) {
                var post = postRepository.findById(report.getTargetId())
                        .orElseThrow(() -> new PostDomainException("Không tìm thấy bài viết"));
                post.hideByAdmin();
                postRepository.save(post);
            } else if (report.getTargetType() == ReportTargetType.COMMENT) {
                var comment = postCommentRepository.findById(report.getTargetId())
                        .orElseThrow(() -> new PostDomainException("Không tìm thấy bình luận"));
                comment.hideByAdmin();
                postCommentRepository.save(comment);
            } else if (report.getTargetType() == ReportTargetType.GROUP) {
                Long groupId = report.getTargetId();
                if (groupRepository.existsById(groupId)) {
                    groupPostRepository.deleteByGroupId(groupId);
                    groupMembershipRepository.deleteByGroupId(groupId);
                    groupRepository.deleteById(groupId);
                }
            }
            report.resolve(adminUserId, note);
        } else {
            report.reject(adminUserId, note);
        }
        return contentReportRepository.save(report);
    }
}
