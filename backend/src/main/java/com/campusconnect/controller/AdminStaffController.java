package com.campusconnect.controller;

import com.campusconnect.dto.CreateStaffRequest;
import com.campusconnect.model.Department;
import com.campusconnect.model.User;
import com.campusconnect.repository.DepartmentRepository;
import com.campusconnect.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/staff")
public class AdminStaffController {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminStaffController(
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping
    public Map<String, Object> createStaff(
            @RequestBody CreateStaffRequest request) {

        if (request.getName() == null
                || request.getName().isBlank()
                || request.getEmail() == null
                || request.getEmail().isBlank()
                || request.getPassword() == null
                || request.getPassword().length() < 8
                || request.getDepartmentId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Enter name, email, password (minimum 8 characters), and department.");
        }

        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An account with this email already exists.");
        }

        Department department = departmentRepository
                .findById(request.getDepartmentId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Department not found."));

        User staff = new User(
                request.getName().trim(),
                email,
                passwordEncoder.encode(request.getPassword()),
                "STAFF");

        staff.setDepartment(department);

        User saved = userRepository.save(staff);

        // Return safe fields only—never return the password/hash.
        return Map.of(
                "id", saved.getId(),
                "name", saved.getName(),
                "email", saved.getEmail(),
                "role", saved.getRole(),
                "department", Map.of(
                        "id", department.getId(),
                        "name", department.getName()));
    }
}