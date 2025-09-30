package com.memail.service;

import com.memail.model.UserPreferences;
import com.memail.repository.UserPreferencesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class UserPreferencesService {

    @Autowired
    private UserPreferencesRepository userPreferencesRepository;

    public UserPreferences getUserPreferences(String userEmail) {
        Optional<UserPreferences> preferences = userPreferencesRepository.findByUserEmail(userEmail);
        return preferences.orElseGet(() -> createDefaultPreferences(userEmail));
    }

    public UserPreferences createOrUpdateUserPreferences(UserPreferences preferences) {
        Optional<UserPreferences> existing = userPreferencesRepository.findByUserEmail(preferences.getUserEmail());

        if (existing.isPresent()) {
            UserPreferences existingPrefs = existing.get();
            updateExistingPreferences(existingPrefs, preferences);
            return userPreferencesRepository.save(existingPrefs);
        } else {
            return userPreferencesRepository.save(preferences);
        }
    }

    public UserPreferences updateUserPreferences(UserPreferences preferences) {
        Optional<UserPreferences> existing = userPreferencesRepository.findByUserEmail(preferences.getUserEmail());

        if (existing.isPresent()) {
            UserPreferences existingPrefs = existing.get();
            updateExistingPreferences(existingPrefs, preferences);
            return userPreferencesRepository.save(existingPrefs);
        } else {
            throw new RuntimeException("User preferences not found for email: " + preferences.getUserEmail());
        }
    }

    public void deleteUserPreferences(String userEmail) {
        userPreferencesRepository.deleteByUserEmail(userEmail);
    }

    private UserPreferences createDefaultPreferences(String userEmail) {
        UserPreferences defaultPrefs = new UserPreferences(userEmail);
        return userPreferencesRepository.save(defaultPrefs);
    }

    private void updateExistingPreferences(UserPreferences existing, UserPreferences updated) {
        if (updated.getEmailsPerPage() != null) {
            existing.setEmailsPerPage(updated.getEmailsPerPage());
        }
        if (updated.getTheme() != null) {
            existing.setTheme(updated.getTheme());
        }
        if (updated.getConversationView() != null) {
            existing.setConversationView(updated.getConversationView());
        }
        if (updated.getAutoMarkRead() != null) {
            existing.setAutoMarkRead(updated.getAutoMarkRead());
        }
        if (updated.getNotificationSound() != null) {
            existing.setNotificationSound(updated.getNotificationSound());
        }
        if (updated.getDesktopNotifications() != null) {
            existing.setDesktopNotifications(updated.getDesktopNotifications());
        }
        if (updated.getCompactView() != null) {
            existing.setCompactView(updated.getCompactView());
        }
        if (updated.getPreviewPane() != null) {
            existing.setPreviewPane(updated.getPreviewPane());
        }
        if (updated.getLanguage() != null) {
            existing.setLanguage(updated.getLanguage());
        }
        if (updated.getTimezone() != null) {
            existing.setTimezone(updated.getTimezone());
        }
    }
}