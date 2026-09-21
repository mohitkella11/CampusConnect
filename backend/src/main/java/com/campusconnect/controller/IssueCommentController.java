
package com.campusconnect.controller;

import com.campusconnect.model.Issue;
import com.campusconnect.model.IssueComment;
import com.campusconnect.model.Notification;
import com.campusconnect.model.User;

import com.campusconnect.repository.IssueCommentRepository;
import com.campusconnect.repository.IssueRepository;
import com.campusconnect.repository.NotificationRepository;
import com.campusconnect.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/issues/{issueId}/comments")
@CrossOrigin(origins = "http://localhost:5173")
public class IssueCommentController {

    private final IssueCommentRepository commentRepository;
    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public IssueCommentController(
            IssueCommentRepository commentRepository,
            IssueRepository issueRepository,
            UserRepository userRepository,
            NotificationRepository notificationRepository) {

        this.commentRepository = commentRepository;
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    private User getCurrentUser(Authentication authentication) {

        if (authentication == null) {
            throw new AccessDeniedException("Not authenticated");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("User not found"));
    }

    /*
     * ADMIN and STAFF can access all issues.
     * STUDENT can access only their own issues.
     */
    private Issue getAccessibleIssue(Long issueId, User user) {

        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Issue not found"));

        boolean isAdmin = "ADMIN".equalsIgnoreCase(user.getRole());

        boolean isStaff = "STAFF".equalsIgnoreCase(user.getRole());

        boolean isReporter = issue.getReportedBy() != null
                && issue.getReportedBy().equals(user.getId());

        if (!isAdmin && !isStaff && !isReporter) {
            throw new AccessDeniedException(
                    "You cannot access this issue");
        }

        return issue;
    }

    @GetMapping
    public List<IssueComment> getComments(
            @PathVariable Long issueId,
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        getAccessibleIssue(issueId, user);

        return commentRepository
                .findByIssueIdOrderByCreatedAtAsc(issueId);
    }

    @PostMapping
    public IssueComment addComment(
            @PathVariable Long issueId,
            @RequestBody CommentRequest request,
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        Issue issue = getAccessibleIssue(issueId, user);

        if (request.getMessage() == null
                || request.getMessage().trim().isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Comment cannot be empty");
        }

        if (request.getMessage().length() > 2000) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Comment must be 2000 characters or less");
        }

        String message = request.getMessage().trim();

        IssueComment comment = new IssueComment();

        comment.setIssueId(issueId);
        comment.setUserId(user.getId());
        comment.setUserName(user.getName());
        comment.setUserRole(user.getRole());
        comment.setMessage(message);

        IssueComment savedComment = commentRepository.save(comment);

        String notificationMessage = user.getName()
                + " added a comment on issue #"
                + issueId
                + ": "
                + message;

        /*
         * Notify the issue reporter if someone else commented.
         */
        Long reporterId = issue.getReportedBy();

        if (reporterId != null
                && !reporterId.equals(user.getId())) {

            notificationRepository.save(
                    new Notification(
                            reporterId,
                            issueId,
                            notificationMessage));
        }

        /*
         * Notify ALL staff accounts, not just the assigned staff.
         *
         * This supports the shared staff account workflow across
         * all departments and unassigned issues.
         */
        if (!"STAFF".equalsIgnoreCase(user.getRole())) {

            List<User> allUsers = userRepository.findAll();

            for (User staff : allUsers) {

                if ("STAFF".equalsIgnoreCase(staff.getRole())
                        && !staff.getId().equals(user.getId())) {

                    notificationRepository.save(
                            new Notification(
                                    staff.getId(),
                                    issueId,
                                    notificationMessage));
                }
            }
        }

        /*
         * If a staff member comments, notify the issue reporter.
         * If an admin comments, the reporter is notified above.
         */

        return savedComment;
    }

    public static class CommentRequest {

        private String message;

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }
}