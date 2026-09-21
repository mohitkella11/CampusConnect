
package com.campusconnect.controller;

import com.campusconnect.dto.LoginRequest;
import com.campusconnect.dto.RegisterRequest;
import com.campusconnect.model.User;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.JwtUtil;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtUtil jwtUtil;

        public AuthController(
                        UserRepository userRepository,
                        PasswordEncoder passwordEncoder,
                        JwtUtil jwtUtil) {
                this.userRepository = userRepository;
                this.passwordEncoder = passwordEncoder;
                this.jwtUtil = jwtUtil;
        }

        @PostMapping("/register")
        public ResponseEntity<?> register(@RequestBody RegisterRequest request) {

                Optional<User> existingUser = userRepository.findByEmail(request.getEmail());

                if (existingUser.isPresent()) {
                        Map<String, String> response = new HashMap<>();
                        response.put("message", "Email already registered");

                        return ResponseEntity
                                        .status(HttpStatus.CONFLICT)
                                        .body(response);
                }

                String role = request.getRole() != null
                                ? request.getRole()
                                : "STUDENT";

                // Do not allow public registration as ADMIN or STAFF
                if (!"STUDENT".equals(role)) {
                        Map<String, String> response = new HashMap<>();
                        response.put("message",
                                        "Only student registration is allowed.");

                        return ResponseEntity
                                        .status(HttpStatus.FORBIDDEN)
                                        .body(response);
                }

                String encodedPassword = passwordEncoder.encode(request.getPassword());

                User user = new User(
                                request.getName(),
                                request.getEmail(),
                                encodedPassword,
                                role);

                User savedUser = userRepository.save(user);

                Map<String, Object> safeUser = new HashMap<>();
                safeUser.put("id", savedUser.getId());
                safeUser.put("name", savedUser.getName());
                safeUser.put("email", savedUser.getEmail());
                safeUser.put("role", savedUser.getRole());

                Map<String, Object> response = new HashMap<>();
                response.put("message", "Registration successful");
                response.put("user", safeUser);

                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(response);
        }

        @PostMapping("/login")
        public ResponseEntity<?> login(@RequestBody LoginRequest request) {

                Optional<User> optionalUser = userRepository.findByEmail(request.getEmail());

                Map<String, Object> response = new HashMap<>();

                if (optionalUser.isEmpty()) {
                        response.put("message", "Invalid email or password");

                        return ResponseEntity
                                        .status(HttpStatus.UNAUTHORIZED)
                                        .body(response);
                }

                User user = optionalUser.get();

                boolean passwordMatches = passwordEncoder.matches(
                                request.getPassword(),
                                user.getPassword());

                if (!passwordMatches) {
                        response.put("message", "Invalid email or password");

                        return ResponseEntity
                                        .status(HttpStatus.UNAUTHORIZED)
                                        .body(response);
                }

                String token = jwtUtil.generateToken(
                                user.getEmail(),
                                user.getRole());

                Map<String, Object> safeUser = new HashMap<>();
                safeUser.put("id", user.getId());
                safeUser.put("name", user.getName());
                safeUser.put("email", user.getEmail());
                safeUser.put("role", user.getRole());

                response.put("message", "Login successful");
                response.put("user", safeUser);
                response.put("token", token);

                return ResponseEntity.ok(response);
        }
}