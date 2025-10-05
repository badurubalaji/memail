package com.memail.service;

import com.memail.dto.CreateUserRequest;
import com.memail.dto.UpdateUserRequest;
import com.memail.dto.UserDTO;
import com.memail.model.UserCredentials;
import com.memail.repository.UserCredentialsRepository;
import com.memail.util.EncryptionUtil;
import com.memail.util.PasswordValidator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserManagementService {

    @Autowired
    private UserCredentialsRepository userCredentialsRepository;

    @Autowired
    private EncryptionUtil encryptionUtil;

    @Autowired
    private MailService mailService;

    /**
     * Get all users
     */
    public List<UserDTO> getAllUsers() {
        return userCredentialsRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get user by ID
     */
    public Optional<UserDTO> getUserById(Long id) {
        return userCredentialsRepository.findById(id)
                .map(this::convertToDTO);
    }

    /**
     * Get user by email
     */
    public Optional<UserDTO> getUserByEmail(String email) {
        return userCredentialsRepository.findByEmail(email)
                .map(this::convertToDTO);
    }

    /**
     * Create a new user (admin only)
     */
    @Transactional
    public UserDTO createUser(CreateUserRequest request) {
        // Check if user already exists
        if (userCredentialsRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("User with email " + request.getEmail() + " already exists");
        }

        // Validate password complexity
        String validationMessage = PasswordValidator.getValidationMessage(request.getPassword());
        if (validationMessage != null) {
            throw new IllegalArgumentException("Password validation failed: " + validationMessage);
        }

        try {
            // Create user in Apache James first
            boolean created = mailService.createJamesUser(request.getEmail(), request.getPassword());
            if (!created) {
                throw new RuntimeException("Failed to create user in mail server");
            }

            // Encrypt password for storage
            String encryptedPassword = encryptionUtil.encrypt(request.getPassword());

            // Create user credentials
            UserCredentials credentials = new UserCredentials(request.getEmail(), encryptedPassword);
            credentials.setRole(request.getRole() != null ? request.getRole() : "USER");
            credentials.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);

            UserCredentials saved = userCredentialsRepository.save(credentials);
            return convertToDTO(saved);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create user: " + e.getMessage(), e);
        }
    }

    /**
     * Update user (admin only)
     */
    @Transactional
    public UserDTO updateUser(Long id, UpdateUserRequest request) {
        UserCredentials credentials = userCredentialsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        try {
            // Update password if provided
            if (request.getPassword() != null && !request.getPassword().isEmpty()) {
                // Validate password complexity
                String validationMessage = PasswordValidator.getValidationMessage(request.getPassword());
                if (validationMessage != null) {
                    throw new IllegalArgumentException("Password validation failed: " + validationMessage);
                }

                // Update password in Apache James
                boolean updated = mailService.updateJamesUserPassword(credentials.getEmail(), request.getPassword());
                if (!updated) {
                    throw new RuntimeException("Failed to update password in mail server");
                }

                // Update encrypted password
                String encryptedPassword = encryptionUtil.encrypt(request.getPassword());
                credentials.setEncryptedPassword(encryptedPassword);
            }

            // Update role if provided
            if (request.getRole() != null) {
                credentials.setRole(request.getRole());
            }

            // Update enabled status if provided
            if (request.getEnabled() != null) {
                credentials.setEnabled(request.getEnabled());

                // If disabling user, close their IMAP connection
                if (!request.getEnabled()) {
                    mailService.closeConnection(credentials.getEmail());
                }
            }

            credentials.setUpdatedAt(LocalDateTime.now());
            UserCredentials updated = userCredentialsRepository.save(credentials);
            return convertToDTO(updated);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update user: " + e.getMessage(), e);
        }
    }

    /**
     * Delete user (admin only)
     */
    @Transactional
    public void deleteUser(Long id) {
        UserCredentials credentials = userCredentialsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        try {
            // Close IMAP connection if active
            mailService.closeConnection(credentials.getEmail());

            // Delete user from Apache James
            boolean deleted = mailService.deleteJamesUser(credentials.getEmail());
            if (!deleted) {
                // Log warning but continue with deletion
                System.err.println("Warning: Failed to delete user from mail server: " + credentials.getEmail());
            }

            // Delete from database
            userCredentialsRepository.delete(credentials);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete user: " + e.getMessage(), e);
        }
    }

    /**
     * Enable user
     */
    @Transactional
    public UserDTO enableUser(Long id) {
        UserCredentials credentials = userCredentialsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        credentials.setEnabled(true);
        credentials.setUpdatedAt(LocalDateTime.now());
        UserCredentials updated = userCredentialsRepository.save(credentials);
        return convertToDTO(updated);
    }

    /**
     * Disable user
     */
    @Transactional
    public UserDTO disableUser(Long id) {
        UserCredentials credentials = userCredentialsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        credentials.setEnabled(false);
        credentials.setUpdatedAt(LocalDateTime.now());

        // Close IMAP connection
        mailService.closeConnection(credentials.getEmail());

        UserCredentials updated = userCredentialsRepository.save(credentials);
        return convertToDTO(updated);
    }

    /**
     * Check if user is admin
     */
    public boolean isAdmin(String email) {
        return userCredentialsRepository.findByEmail(email)
                .map(UserCredentials::isAdmin)
                .orElse(false);
    }

    /**
     * Convert UserCredentials to UserDTO
     */
    private UserDTO convertToDTO(UserCredentials credentials) {
        return new UserDTO(
                credentials.getId(),
                credentials.getEmail(),
                credentials.getRole(),
                credentials.getEnabled(),
                credentials.getCreatedAt(),
                credentials.getUpdatedAt(),
                credentials.getLastConnectionAt()
        );
    }
}
