
package com.campusconnect.controller;

import com.campusconnect.model.Issue;
import com.campusconnect.model.IssueRating;
import com.campusconnect.model.User;
import com.campusconnect.repository.IssueRatingRepository;
import com.campusconnect.repository.IssueRepository;
import com.campusconnect.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@RestController
@RequestMapping("/api/issues/{issueId}/rating")
@CrossOrigin(origins = "http://localhost:5173")
public class IssueRatingController {

    private final IssueRatingRepository ratingRepository;
    private final IssueRepository issueRepository;
    private final UserRepository userRepository;

    public IssueRatingController(
            IssueRatingRepository ratingRepository,
            IssueRepository issueRepository,
            UserRepository userRepository) {
        this.ratingRepository = ratingRepository;
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Not authenticated");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("User not found"));
    }

    private Issue getResolvedIssueForStudent(
            Long issueId, User user) {

        if (!"STUDENT".equalsIgnoreCase(user.getRole())) {
            throw new AccessDeniedException(
                    "Only students can rate issues");
        }

        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Issue not found"));

        if (issue.getReportedBy() == null
                || !issue.getReportedBy().equals(user.getId())) {
            throw new AccessDeniedException(
                    "You can only rate your own issues");
        }

        if (!"RESOLVED".equalsIgnoreCase(issue.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "You can rate an issue only after it is resolved");
        }

        return issue;
    }

    @GetMapping
    public Optional<IssueRating> getMyRating(
            @PathVariable Long issueId,
            Authentication authentication) {

        User user = getCurrentUser(authentication);
        getResolvedIssueForStudent(issueId, user);

        return ratingRepository.findByIssueIdAndStudentId(
                issueId, user.getId());
    }

    @PostMapping
    public IssueRating submitRating(
            @PathVariable Long issueId,
            @RequestBody RatingRequest request,
            Authentication authentication) {

        User user = getCurrentUser(authentication);
        getResolvedIssueForStudent(issueId, user);

        if (request.getRating() == null
                || request.getRating() < 1
                || request.getRating() > 5) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Rating must be between 1 and 5");
        }

        if (request.getFeedback() != null
                && request.getFeedback().length() > 2000) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Feedback must be 2000 characters or less");
        }

        IssueRating rating = ratingRepository
                .findByIssueIdAndStudentId(issueId, user.getId())
                .orElseGet(IssueRating::new);

        rating.setIssueId(issueId);
        rating.setStudentId(user.getId());
        rating.setRating(request.getRating());
        rating.setFeedback(
                request.getFeedback() == null
                        ? null
                        : request.getFeedback().trim());

        return ratingRepository.save(rating);
    }

    public static class RatingRequest {
        private Integer rating;
        private String feedback;

        public Integer getRating() {
            return rating;
        }

        public void setRating(Integer rating) {
            this.rating = rating;
        }

        public String getFeedback() {
            return feedback;
        }

        public void setFeedback(String feedback) {
            this.feedback = feedback;
        }
    }
}