
package com.campusconnect.controller;

import com.campusconnect.dto.IssueClassificationRequest;
import com.campusconnect.service.IssueClassificationService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/issues")
public class IssueClassificationController {

    private final IssueClassificationService classificationService;

    public IssueClassificationController(
            IssueClassificationService classificationService) {
        this.classificationService = classificationService;
    }

    @PostMapping("/classify")
    public ResponseEntity<?> classifyIssue(
            @RequestBody IssueClassificationRequest request) {

        if (request.getTitle() == null
                || request.getTitle().isBlank()
                || request.getDescription() == null
                || request.getDescription().isBlank()) {

            return ResponseEntity.badRequest().body(
                    Map.of("error", "Title and description are required."));
        }

        Map<String, Object> result = classificationService.classify(
                request.getTitle(),
                request.getDescription());

        return ResponseEntity.ok(result);
    }
}