package com.memail.controller;

import com.memail.model.UserPreferences;
import com.memail.service.UserPreferencesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/preferences")
@CrossOrigin(origins = "http://localhost:4200")
public class UserPreferencesController {

    @Autowired
    private UserPreferencesService userPreferencesService;

    @GetMapping("/{userEmail}")
    public ResponseEntity<UserPreferences> getUserPreferences(@PathVariable String userEmail) {
        try {
            UserPreferences preferences = userPreferencesService.getUserPreferences(userEmail);
            return ResponseEntity.ok(preferences);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{userEmail}")
    public ResponseEntity<UserPreferences> updateUserPreferences(
            @PathVariable String userEmail,
            @RequestBody UserPreferences preferences) {
        try {
            preferences.setUserEmail(userEmail);
            UserPreferences updated = userPreferencesService.updateUserPreferences(preferences);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{userEmail}")
    public ResponseEntity<UserPreferences> createOrUpdateUserPreferences(
            @PathVariable String userEmail,
            @RequestBody UserPreferences preferences) {
        try {
            preferences.setUserEmail(userEmail);
            UserPreferences updated = userPreferencesService.createOrUpdateUserPreferences(preferences);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{userEmail}")
    public ResponseEntity<Void> deleteUserPreferences(@PathVariable String userEmail) {
        try {
            userPreferencesService.deleteUserPreferences(userEmail);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}