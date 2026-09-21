
package com.campusconnect.controller;

import com.campusconnect.model.IssueHistory;
import com.campusconnect.model.User;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.IssueService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issues")
@CrossOrigin(origins = "http://localhost:5173")
public class IssueHistoryController {

    private final IssueService issueService;
    private final UserRepository userRepository;

    public IssueHistoryController(
            IssueService issueService,
            UserRepository userRepository) {
        this.issueService = issueService;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }

    @GetMapping("/{issueId}/history")
    public ResponseEntity<List<IssueHistory>> getIssueHistory(
            @PathVariable Long issueId) {

        return ResponseEntity.ok(
                issueService.getIssueHistory(
                        issueId, getCurrentUser()));
    }
}