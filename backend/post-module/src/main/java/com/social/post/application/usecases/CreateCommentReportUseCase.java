package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.ContentReportRepository;
import com.social.post.domain.repositories.PostCommentRepository;

@Service
public class CreateCommentReportUseCase {
    private final PostCommentRepository postCommentRepository;
    private final ContentReportRepository contentReportRepository;

    public CreateCommentReportUseCase(
            PostCommentRepository postCommentRepository,
            ContentReportRepository contentReportRepository) {
        this.postCommentRepository = postCommentRepository;
        this.contentReportRepository = contentReportRepository;
    }

    @Transactional
    public com.social.post.domain.entities.ContentReport execute(Long actorId, Long commentId, String reason) {
        var comment = postCommentRepository.findById(commentId)
                .orElseThrow(() -> new PostDomainException("Không tìm thấy bình luận"));
        if (comment.getUserId().equals(actorId)) {
            throw new PostDomainException("Không thể tự báo cáo bình luận của chính mình");
        }
        return contentReportRepository.save(
                com.social.post.domain.entities.ContentReport.createCommentReport(
                        actorId,
                        comment.getId(),
                        comment.getPostId(),
                        reason));
    }
}
