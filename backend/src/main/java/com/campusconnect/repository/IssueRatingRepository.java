
package com.campusconnect.repository;

import com.campusconnect.model.IssueRating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface IssueRatingRepository
        extends JpaRepository<IssueRating, Long> {

    Optional<IssueRating> findByIssueIdAndStudentId(
            Long issueId,
            Long studentId);

    List<IssueRating> findAllByOrderByCreatedAtDesc();
}