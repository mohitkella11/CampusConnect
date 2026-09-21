
package com.campusconnect.controller;

import com.campusconnect.model.Issue;
import com.campusconnect.repository.IssueRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/analytics")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminAnalyticsController {

    private final IssueRepository issueRepository;

    public AdminAnalyticsController(IssueRepository issueRepository) {
        this.issueRepository = issueRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAnalytics() {

        List<Issue> issues = issueRepository.findAll();

        long totalIssues = issues.size();

        long pending = countByStatus(issues, "PENDING");
        long inProgress = countByStatus(issues, "IN_PROGRESS");
        long resolved = countByStatus(issues, "RESOLVED");
        long rejected = countByStatus(issues, "REJECTED");

        Map<String, Long> categoryStats = groupCount(
                issues,
                Issue::getCategory);

        Map<String, Long> priorityStats = groupCount(
                issues,
                Issue::getPriority);

        Map<String, Long> staffWorkload = issues.stream()
                .filter(issue -> issue.getAssignedStaffName() != null
                        && !issue.getAssignedStaffName().isBlank())
                .collect(Collectors.groupingBy(
                        Issue::getAssignedStaffName,
                        TreeMap::new,
                        Collectors.counting()));

        Map<String, Object> response = new LinkedHashMap<>();

        response.put("totalIssues", totalIssues);
        response.put("pending", pending);
        response.put("inProgress", inProgress);
        response.put("resolved", resolved);
        response.put("rejected", rejected);

        response.put("categoryStats", categoryStats);
        response.put("priorityStats", priorityStats);
        response.put("staffWorkload", staffWorkload);

        return ResponseEntity.ok(response);
    }

    private long countByStatus(List<Issue> issues, String status) {
        return issues.stream()
                .filter(issue -> status.equalsIgnoreCase(issue.getStatus()))
                .count();
    }

    private Map<String, Long> groupCount(
            List<Issue> issues,
            Function<Issue, String> classifier) {
        return issues.stream()
                .collect(Collectors.groupingBy(
                        issue -> {
                            String value = classifier.apply(issue);
                            return value == null || value.isBlank()
                                    ? "Unspecified"
                                    : value;
                        },
                        TreeMap::new,
                        Collectors.counting()));
    }
}