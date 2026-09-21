package com.campusconnect.controller;

import com.campusconnect.model.User;
import com.campusconnect.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@CrossOrigin(origins = "http://localhost:5173")
public class StaffController {

    private final UserRepository userRepository;

    public StaffController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllStaff() {

        List<User> staff =
                userRepository.findByRole("STAFF");

        return ResponseEntity.ok(staff);
    }
}