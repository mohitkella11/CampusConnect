
package com.campusconnect.controller;

import com.campusconnect.model.IssueRating;
import com.campusconnect.repository.IssueRatingRepository;
import com.campusconnect.repository.UserRepository;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/ratings")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminRatingController {

    private final IssueRatingRepository ratingRepository;
    private final UserRepository userRepository;

    public AdminRatingController(
            IssueRatingRepository ratingRepository,
            UserRepository userRepository) {
        this.ratingRepository = ratingRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<IssueRating> getAllRatings(
            Authentication authentication) {

        if (authentication == null) {
            throw new AccessDeniedException(
                    "Not authenticated");
        }

        var user = userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException(
                        "User not found"));

        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new AccessDeniedException(
                    "Only admins can view all ratings");
        }

        return ratingRepository
                .findAllByOrderByCreatedAtDesc();
    }
}