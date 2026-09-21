
package com.campusconnect.controller;

import com.campusconnect.model.User;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.IssueService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:5173")
public class NotificationController {

    private final IssueService issueService;
    private final UserRepository userRepository;

    public NotificationController(
            IssueService issueService,
            UserRepository userRepository) {
        this.issueService = issueService;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getNotifications(
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                issueService.getNotifications(
                        userId, getCurrentUser()));
    }

    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<?> getUnreadCount(
            @PathVariable Long userId) {
        return ResponseEntity.ok(
                issueService.getUnreadNotificationCount(
                        userId, getCurrentUser()));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long notificationId) {
        return ResponseEntity.ok(
                issueService.markNotificationAsRead(
                        notificationId, getCurrentUser()));
    }
}