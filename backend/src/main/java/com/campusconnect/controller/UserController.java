
package com.campusconnect.controller;

import com.campusconnect.model.User;
import com.campusconnect.model.Department;
import com.campusconnect.service.UserService;
import com.campusconnect.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    public UserController(
            UserService userService,
            UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }

    private void requireAdmin() {
        if (!"ADMIN".equalsIgnoreCase(getCurrentUser().getRole())) {
            throw new AccessDeniedException(
                    "Admin access required.");
        }
    }

    private Map<String, Object> toStaffResponse(User staff) {
        Department department = staff.getDepartment();

        return Map.of(
                "id", staff.getId(),
                "name", staff.getName(),
                "email", staff.getEmail(),
                "role", staff.getRole(),
                "department", department == null
                        ? Map.of()
                        : Map.of(
                                "id", department.getId(),
                                "name", department.getName()));
    }

    public record CreateStaffRequest(
            String name,
            String email,
            String password,
            Long departmentId) {
    }

    @PostMapping("/staff")
    public ResponseEntity<?> createStaff(
            @RequestBody CreateStaffRequest request) {

        User admin = getCurrentUser();

        User created = userService.createStaff(
                request.name(),
                request.email(),
                request.password(),
                request.departmentId(),
                admin);

        return ResponseEntity.ok(toStaffResponse(created));
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        requireAdmin();
        return userService.createUser(user);
    }

    @GetMapping
    public List<Map<String, Object>> getAllUsers() {
        requireAdmin();

        return userService.getAllUsers()
                .stream()
                .filter(u -> "STAFF".equalsIgnoreCase(u.getRole()))
                .map(this::toStaffResponse)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        requireAdmin();

        return userService.findById(id)
                .map(this::toStaffResponse)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        requireAdmin();
        userService.deleteUser(id);

        return ResponseEntity.ok(
                Map.of("message", "User deleted."));
    }

    @PutMapping("/{staffId}/department/{departmentId}")
    public ResponseEntity<?> assignDepartment(
            @PathVariable Long staffId,
            @PathVariable Long departmentId) {

        User updated = userService.assignDepartmentToStaff(
                staffId, departmentId, getCurrentUser());

        return ResponseEntity.ok(toStaffResponse(updated));
    }

    @GetMapping("/department/{departmentId}/staff")
    public List<Map<String, Object>> getStaffByDepartment(
            @PathVariable Long departmentId) {

        return userService.getStaffByDepartment(departmentId)
                .stream()
                .map(this::toStaffResponse)
                .toList();
    }
}