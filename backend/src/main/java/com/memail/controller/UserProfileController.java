package com.memail.controller;

import com.memail.dto.UpdateProfileRequest;
import com.memail.dto.UserAutocompleteDTO;
import com.memail.dto.UserProfileDTO;
import com.memail.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller for user profile management
 */
@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "${cors.allowed-origins}", allowCredentials = "true")
public class UserProfileController {

    @Autowired
    private UserProfileService userProfileService;

    /**
     * Get current user's profile
     */
    @GetMapping
    public ResponseEntity<?> getUserProfile(Authentication authentication) {
        try {
            String email = (String) authentication.getPrincipal();
            UserProfileDTO profile = userProfileService.getUserProfile(email);
            return ResponseEntity.ok(profile);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", "Not found", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Server error", "message", e.getMessage()));
        }
    }

    /**
     * Update current user's profile
     */
    @PutMapping
    public ResponseEntity<?> updateUserProfile(@Valid @RequestBody UpdateProfileRequest request,
                                               Authentication authentication) {
        try {
            String email = (String) authentication.getPrincipal();
            UserProfileDTO profile = userProfileService.updateUserProfile(email, request);
            return ResponseEntity.ok(profile);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400)
                    .body(Map.of("error", "Bad request", "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Server error", "message", e.getMessage()));
        }
    }

    /**
     * Get all users for autocomplete/mention functionality
     * Returns only basic information (email, first name, last name) for enabled users
     * Available to all authenticated users
     */
    @GetMapping("/users/autocomplete")
    public ResponseEntity<?> getUsersForAutocomplete(Authentication authentication) {
        try {
            // Verify user is authenticated
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401)
                        .body(Map.of("error", "Unauthorized", "message", "Authentication required"));
            }

            List<UserAutocompleteDTO> users = userProfileService.getAllUsersForAutocomplete();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Server error", "message", e.getMessage()));
        }
    }
}
