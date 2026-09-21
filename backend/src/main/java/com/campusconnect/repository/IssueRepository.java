
package com.campusconnect.repository;

import com.campusconnect.model.Issue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssueRepository
                extends JpaRepository<Issue, Long> {

        List<Issue> findAllByOrderByCreatedAtDesc();

        List<Issue> findByReportedByOrderByCreatedAtDesc(
                        Long userId);

        List<Issue> findByAssignedToOrderByCreatedAtDesc(
                        Long staffId);

        // Find issues assigned to a department
        List<Issue> findByDepartment_IdOrderByCreatedAtDesc(
                        Long departmentId);
}