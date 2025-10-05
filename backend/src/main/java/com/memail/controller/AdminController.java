package com.memail.controller;

import com.memail.dto.CreateUserRequest;
import com.memail.dto.UpdateUserRequest;
import com.memail.dto.UserDTO;
import com.memail.service.AuditLogService;
import com.memail.service.UserManagementService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Admin controller for managing users (admin only)
 */
@RestController
@RequestMapping("/admin")
@CrossOrigin
public class AdminController {

    @Autowired
    private UserManagementService userManagementService;

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Get all users (admin only)
     */
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(Authentication authentication) {
        try {
            // Verify admin access
            if (!isAdmin(authentication)) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "Access denied", "message", "Admin access required"));
            }

            List<UserDTO> users = userManagementService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Server error", "message", e.getMessage()));
        }
    }

    /**
     * Get user by ID (admin only)
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id, Authentication authentication) {
        try {
            // Verify admin access
            if (!isAdmin(authentication)) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "Access denied", "message", "Admin access required"));
            }

            return userManagementService.getUserById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Server error", "message", e.getMessage()));
        }
    }

    /**
     * Create new user (admin only)
     */
    @PostMapping("/users")
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request,
                                        Authentication authentication) {
        String adminEmail = getAdminEmail(authentication);
        try {
            // Verify admin access
            if (!isAdmin(authentication)) {
                auditLogService.logUserCreated(adminEmail, request.getEmail(), false);
                return ResponseEntity.status(403)
                        .body(Map.of("error", "Access denied", "message", "Admin access required"));
            }

            UserDTO user = userManagementService.createUser(request);
            auditLogService.logUserCreated(adminEmail, request.getEmail(), true);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            auditLogService.logUserCreated(adminEmail, request.getEmail(), false);
            return ResponseEntity.status(400)
                    .body(Map.of("error", "Bad request", "message", e.getMessage()));
        } catch (Exception e) {
            auditLogService.logUserCreated(adminEmail, request.getEmail(), false);
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Server error", "message", e.getMessage()));
        }
    }

    /**
     * Update user (admin only)
     */
    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id,
                                        @Valid @RequestBody UpdateUserRequest request,
                                        Authentication authentication) {
        try {
            // Verify admin access
            if (!isAdmin(authentication)) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "Access denied", "message", "Admin access required"));
            }

            UserDTO user = userManagementService.updateUser(id, request);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400)
                    .body(Map.of("error", "Bad request", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Server error", "message", e.getMessage()));
        }
    }

    /**
     * Delete user (admin only)
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Authentication authentication) {
        try {
            // Verify admin access
            if (!isAdmin(authentication)) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "Access denied", "message", "Admin access required"));
            }

            userManagementService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400)
                    .body(Map.of("error", "Bad request", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Server error", "message", e.getMessage()));
        }
    }

    /**
     * Enable user (admin only)
     */
    @PostMapping("/users/{id}/enable")
    public ResponseEntity<?> enableUser(@PathVariable Long id, Authentication authentication) {
        try {
            // Verify admin access
            if (!isAdmin(authentication)) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "Access denied", "message", "Admin access required"));
            }

            UserDTO user = userManagementService.enableUser(id);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400)
                    .body(Map.of("error", "Bad request", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Server error", "message", e.getMessage()));
        }
    }

    /**
     * Disable user (admin only)
     */
    @PostMapping("/users/{id}/disable")
    public ResponseEntity<?> disableUser(@PathVariable Long id, Authentication authentication) {
        try {
            // Verify admin access
            if (!isAdmin(authentication)) {
                return ResponseEntity.status(403)
                        .body(Map.of("error", "Access denied", "message", "Admin access required"));
            }

            UserDTO user = userManagementService.disableUser(id);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400)
                    .body(Map.of("error", "Bad request", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Server error", "message", e.getMessage()));
        }
    }

    /**
     * Check if authenticated user is admin
     */
    private boolean isAdmin(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String email = (String) authentication.getPrincipal();
        return userManagementService.isAdmin(email);
    }

    /**
     * Get admin email from authentication
     */
    private String getAdminEmail(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return "UNKNOWN";
        }
        return (String) authentication.getPrincipal();
    }
}
