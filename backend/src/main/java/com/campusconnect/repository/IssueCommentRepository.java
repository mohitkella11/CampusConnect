
package com.campusconnect.repository;

import com.campusconnect.model.IssueComment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IssueCommentRepository
        extends JpaRepository<IssueComment, Long> {

    List<IssueComment> findByIssueIdOrderByCreatedAtAsc(
            Long issueId);
}