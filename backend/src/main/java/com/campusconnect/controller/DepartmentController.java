
package com.campusconnect.controller;

import com.campusconnect.model.Department;
import com.campusconnect.model.User;
import com.campusconnect.repository.DepartmentRepository;
import com.campusconnect.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departments")
@CrossOrigin(origins = "http://localhost:5173")
public class DepartmentController {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    public DepartmentController(
            DepartmentRepository departmentRepository,
            UserRepository userRepository) {
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }

    private void requireAdmin() {
        User user = getCurrentUser();

        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new AccessDeniedException(
                    "Admin access required.");
        }
    }

    // Get all departments
    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(
                departmentRepository.findAll());
    }

    // Get department by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getDepartmentById(
            @PathVariable Long id) {

        return departmentRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "message",
                                "Department not found.")));
    }

    // Create department (Admin only)
    @PostMapping
    public ResponseEntity<?> createDepartment(
            @RequestBody Department department) {

        requireAdmin();

        if (department.getName() == null
                || department.getName().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Department name is required."));
        }

        String name = department.getName().trim();

        if (departmentRepository.existsByName(name)) {
            return ResponseEntity.status(
                    HttpStatus.CONFLICT)
                    .body(Map.of(
                            "message",
                            "Department already exists."));
        }

        department.setName(name);

        Department saved = departmentRepository.save(department);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(saved);
    }

    // Update department (Admin only)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateDepartment(
            @PathVariable Long id,
            @RequestBody Department updatedDepartment) {

        requireAdmin();

        return departmentRepository.findById(id)
                .<ResponseEntity<?>>map(existing -> {

                    if (updatedDepartment.getName() == null
                            || updatedDepartment.getName()
                                    .isBlank()) {
                        return ResponseEntity.badRequest()
                                .body(Map.of(
                                        "message",
                                        "Department name is required."));
                    }

                    String name = updatedDepartment.getName().trim();

                    boolean nameUsed = departmentRepository.existsByName(name);

                    boolean sameName = existing.getName()
                            .equalsIgnoreCase(name);

                    if (nameUsed && !sameName) {
                        return ResponseEntity.status(
                                HttpStatus.CONFLICT)
                                .body(Map.of(
                                        "message",
                                        "Department name already exists."));
                    }

                    existing.setName(name);
                    existing.setDescription(
                            updatedDepartment.getDescription());

                    Department saved = departmentRepository.save(existing);

                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "message",
                                "Department not found.")));
    }

    // Delete department (Admin only)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDepartment(
            @PathVariable Long id) {

        requireAdmin();

        return departmentRepository.findById(id)
                .<ResponseEntity<?>>map(department -> {
                    try {
                        departmentRepository.delete(department);

                        return ResponseEntity.ok(
                                Map.of(
                                        "message",
                                        "Department deleted successfully."));
                    } catch (Exception exception) {
                        return ResponseEntity.status(
                                HttpStatus.CONFLICT)
                                .body(Map.of(
                                        "message",
                                        "Cannot delete this department. "
                                                + "It may be assigned to users "
                                                + "or issues."));
                    }
                })
                .orElseGet(() -> ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "message",
                                "Department not found.")));
    }
}