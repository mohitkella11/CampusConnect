
package com.campusconnect.controller;

import com.campusconnect.model.Issue;
import com.campusconnect.model.User;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.IssueService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/issues")
@CrossOrigin(origins = "http://localhost:5173")
public class IssueController {

        private final IssueService issueService;
        private final UserRepository userRepository;

        public IssueController(
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

        @PostMapping
        public ResponseEntity<Issue> createIssue(
                        @RequestBody Issue issue) {

                Issue savedIssue = issueService.createIssue(
                                issue, getCurrentUser());

                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(savedIssue);
        }

        @GetMapping
        public ResponseEntity<List<Issue>> getAllIssues() {
                return ResponseEntity.ok(
                                issueService.getAllIssues(getCurrentUser()));
        }

        @GetMapping("/user/{userId}")
        public ResponseEntity<List<Issue>> getIssuesByUser(
                        @PathVariable Long userId) {

                return ResponseEntity.ok(
                                issueService.getIssuesByUser(
                                                userId, getCurrentUser()));
        }

        @GetMapping("/assigned/{staffId}")
        public ResponseEntity<List<Issue>> getAssignedIssues(
                        @PathVariable Long staffId) {

                return ResponseEntity.ok(
                                issueService.getAssignedIssues(
                                                staffId, getCurrentUser()));
        }

        @GetMapping("/{id}")
        public ResponseEntity<?> getIssueById(
                        @PathVariable Long id) {

                return issueService.getIssueById(
                                id, getCurrentUser())
                                .<ResponseEntity<?>>map(ResponseEntity::ok)
                                .orElseGet(() -> {
                                        Map<String, String> response = new HashMap<>();
                                        response.put("message", "Issue not found");

                                        return ResponseEntity.status(
                                                        HttpStatus.NOT_FOUND).body(response);
                                });
        }

        @PutMapping("/{id}")
        public ResponseEntity<?> updateIssue(
                        @PathVariable Long id,
                        @RequestBody Issue updatedIssue) {

                return issueService.updateIssue(
                                id, updatedIssue, getCurrentUser())
                                .<ResponseEntity<?>>map(ResponseEntity::ok)
                                .orElseGet(() -> {
                                        Map<String, String> response = new HashMap<>();
                                        response.put("message", "Issue not found");

                                        return ResponseEntity.status(
                                                        HttpStatus.NOT_FOUND).body(response);
                                });
        }

        @PutMapping("/{id}/status")
        public ResponseEntity<?> updateStatus(
                        @PathVariable Long id,
                        @RequestParam String status) {

                return issueService.updateStatus(
                                id, status, getCurrentUser())
                                .<ResponseEntity<?>>map(ResponseEntity::ok)
                                .orElseGet(() -> {
                                        Map<String, String> response = new HashMap<>();
                                        response.put("message", "Issue not found");

                                        return ResponseEntity.status(
                                                        HttpStatus.NOT_FOUND).body(response);
                                });
        }

        @PutMapping("/{id}/priority")
        public ResponseEntity<?> updatePriority(
                        @PathVariable Long id,
                        @RequestParam String priority) {

                return issueService.updatePriority(
                                id, priority, getCurrentUser())
                                .<ResponseEntity<?>>map(ResponseEntity::ok)
                                .orElseGet(() -> {
                                        Map<String, String> response = new HashMap<>();
                                        response.put("message", "Issue not found");

                                        return ResponseEntity.status(
                                                        HttpStatus.NOT_FOUND).body(response);
                                });
        }

        @PutMapping("/{issueId}/assign/{staffId}")
        public ResponseEntity<?> assignIssue(
                        @PathVariable Long issueId,
                        @PathVariable Long staffId) {

                return issueService.assignIssue(
                                issueId, staffId, getCurrentUser())
                                .<ResponseEntity<?>>map(ResponseEntity::ok)
                                .orElseGet(() -> {
                                        Map<String, String> response = new HashMap<>();
                                        response.put(
                                                        "message",
                                                        "Issue or staff member not found.");

                                        return ResponseEntity.status(
                                                        HttpStatus.NOT_FOUND).body(response);
                                });
        }

        // Admin assigns an issue to a department
        @PutMapping("/{issueId}/department/{departmentId}")
        public ResponseEntity<?> assignIssueToDepartment(
                        @PathVariable Long issueId,
                        @PathVariable Long departmentId) {

                return issueService.assignIssueToDepartment(
                                issueId, departmentId, getCurrentUser())
                                .<ResponseEntity<?>>map(ResponseEntity::ok)
                                .orElseGet(() -> ResponseEntity
                                                .status(HttpStatus.NOT_FOUND)
                                                .body(Map.of(
                                                                "message",
                                                                "Issue or department not found.")));
        }

        // Staff views issues assigned to their department
        @GetMapping("/department")
        public ResponseEntity<List<Issue>> getDepartmentIssues() {
                return ResponseEntity.ok(
                                issueService.getDepartmentIssues(
                                                getCurrentUser()));
        }
}