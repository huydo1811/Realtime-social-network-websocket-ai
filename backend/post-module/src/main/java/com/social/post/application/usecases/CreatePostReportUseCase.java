package com.social.post.application.usecases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.social.post.domain.entities.ContentReport;
import com.social.post.domain.entities.PostStatus;
import com.social.post.domain.exceptions.PostDomainException;
import com.social.post.domain.repositories.ContentReportRepository;
import com.social.post.domain.repositories.PostRepository;

@Service
public class CreatePostReportUseCase {
    private final PostRepository postRepository;
    private final ContentReportRepository contentReportRepository;

    public CreatePostReportUseCase(
            PostRepository postRepository,
            ContentReportRepository contentReportRepository) {
        this.postRepository = postRepository;
        this.contentReportRepository = contentReportRepository;
    }

    @Transactional
    public ContentReport execute(Long actorId, Long postId, String reason) {
        var post = postRepository.findById(postId)
                .orElseThrow(() -> new PostDomainException("Không tìm thấy bài viết"));
        if (post.getStatus() == PostStatus.DELETED) {
            throw new PostDomainException("Bài viết đã bị xóa");
        }
        return contentReportRepository.save(ContentReport.createPostReport(actorId, postId, reason));
    }
}
