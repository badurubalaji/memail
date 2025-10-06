package com.memail.service;

import com.memail.dto.UpdateProfileRequest;
import com.memail.dto.UserAutocompleteDTO;
import com.memail.dto.UserProfileDTO;
import com.memail.model.UserCredentials;
import com.memail.repository.UserCredentialsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing user profiles
 */
@Service
public class UserProfileService {

    @Autowired
    private UserCredentialsRepository userCredentialsRepository;

    /**
     * Get user profile by email
     */
    public UserProfileDTO getUserProfile(String email) {
        UserCredentials credentials = userCredentialsRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        return convertToProfileDTO(credentials);
    }

    /**
     * Update user profile
     */
    @Transactional
    public UserProfileDTO updateUserProfile(String email, UpdateProfileRequest request) {
        UserCredentials credentials = userCredentialsRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        // Update profile fields
        if (request.getFirstName() != null) {
            credentials.setFirstName(request.getFirstName());
        }

        if (request.getLastName() != null) {
            credentials.setLastName(request.getLastName());
        }

        if (request.getDateOfBirth() != null) {
            credentials.setDateOfBirth(request.getDateOfBirth());
        }

        if (request.getGender() != null) {
            credentials.setGender(request.getGender());
        }

        if (request.getPhone() != null) {
            credentials.setPhone(request.getPhone());
        }

        if (request.getBackupEmail() != null) {
            // Validate that backup email is different from primary email
            if (request.getBackupEmail().equalsIgnoreCase(email)) {
                throw new IllegalArgumentException("Backup email cannot be the same as primary email");
            }
            credentials.setBackupEmail(request.getBackupEmail());
        }

        credentials.setUpdatedAt(LocalDateTime.now());
        UserCredentials updated = userCredentialsRepository.save(credentials);

        return convertToProfileDTO(updated);
    }

    /**
     * Get all users for autocomplete/mention functionality
     * Returns only enabled users with basic information
     */
    public List<UserAutocompleteDTO> getAllUsersForAutocomplete() {
        List<UserCredentials> users = userCredentialsRepository.findAll();
        return users.stream()
                .filter(UserCredentials::getEnabled) // Only enabled users
                .map(user -> new UserAutocompleteDTO(
                        user.getEmail(),
                        user.getFirstName(),
                        user.getLastName()
                ))
                .collect(Collectors.toList());
    }

    /**
     * Convert UserCredentials to UserProfileDTO
     */
    private UserProfileDTO convertToProfileDTO(UserCredentials credentials) {
        return new UserProfileDTO(
                credentials.getId(),
                credentials.getEmail(),
                credentials.getFirstName(),
                credentials.getLastName(),
                credentials.getDateOfBirth(),
                credentials.getGender(),
                credentials.getPhone(),
                credentials.getBackupEmail(),
                credentials.getRole(),
                credentials.getEnabled(),
                credentials.getCreatedAt(),
                credentials.getUpdatedAt()
        );
    }
}
