
package com.campusconnect.service;

import com.campusconnect.model.User;
import com.campusconnect.model.Department;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.repository.DepartmentRepository;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            DepartmentRepository departmentRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User createStaff(
            String name,
            String email,
            String password,
            Long departmentId,
            User currentUser) {

        requireAdmin(currentUser);

        if (name == null || name.isBlank()
                || email == null || email.isBlank()
                || password == null || password.length() < 8
                || departmentId == null) {
            throw new IllegalArgumentException(
                    "Name, email, password (at least 8 characters), "
                            + "and department are required.");
        }

        String normalizedEmail = email.trim().toLowerCase();

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException(
                    "An account with this email already exists.");
        }

        Department department = departmentRepository
                .findById(departmentId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Department not found."));

        User staff = new User();
        staff.setName(name.trim());
        staff.setEmail(normalizedEmail);
        staff.setPassword(passwordEncoder.encode(password));
        staff.setRole("STAFF");
        staff.setDepartment(department);

        return userRepository.save(staff);
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    @Transactional
    public User assignDepartmentToStaff(
            Long staffId, Long departmentId, User currentUser) {

        requireAdmin(currentUser);

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Staff member not found."));

        if (!"STAFF".equalsIgnoreCase(staff.getRole())) {
            throw new IllegalArgumentException(
                    "Selected user is not a staff member.");
        }

        Department department = departmentRepository
                .findById(departmentId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Department not found."));

        staff.setDepartment(department);
        return userRepository.save(staff);
    }

    public List<User> getStaffByDepartment(Long departmentId) {
        if (!departmentRepository.existsById(departmentId)) {
            throw new IllegalArgumentException(
                    "Department not found.");
        }

        return userRepository
                .findByRoleAndDepartment_Id("STAFF", departmentId);
    }

    private void requireAdmin(User currentUser) {
        if (!"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            throw new AccessDeniedException(
                    "Admin access required.");
        }
    }
}