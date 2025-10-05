package com.memail.service;

import com.memail.dto.LoginRequest;
import com.memail.dto.LoginResponse;
import com.memail.model.PasswordResetToken;
import com.memail.model.RefreshToken;
import com.memail.model.UserCredentials;
import com.memail.repository.PasswordResetTokenRepository;
import com.memail.repository.RefreshTokenRepository;
import com.memail.repository.UserCredentialsRepository;
import com.memail.security.JwtTokenProvider;
import com.memail.util.EncryptionUtil;
import com.memail.util.PasswordValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private static final int PASSWORD_RESET_TOKEN_EXPIRY_MINUTES = 30;

    @Autowired
    private MailService mailService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserCredentialsRepository userCredentialsRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private EncryptionUtil encryptionUtil;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${frontend.url:http://localhost:4545}")
    private String frontendUrl;

    /**
     * Authenticate user against IMAP server and generate JWT token with refresh token
     */
    @Transactional
    public LoginResponse login(LoginRequest loginRequest) {
        return login(loginRequest, null);
    }

    /**
     * Authenticate user against IMAP server and generate JWT token with refresh token
     */
    @Transactional
    public LoginResponse login(LoginRequest loginRequest, String deviceInfo) {
        String email = loginRequest.getEmail();
        String password = loginRequest.getPassword();

        // Check if user exists and is enabled in database
        Optional<UserCredentials> existingUser = userCredentialsRepository.findByEmail(email);
        if (existingUser.isPresent() && !existingUser.get().getEnabled()) {
            throw new BadCredentialsException("Account is disabled");
        }

        // Validate credentials against Apache James IMAP server
        boolean isAuthenticated = mailService.authenticateUser(email, password);

        if (!isAuthenticated) {
            throw new BadCredentialsException("Invalid email or password");
        }

        // Store encrypted IMAP credentials for session persistence across server restarts
        UserCredentials userCreds = null;
        try {
            String encryptedPassword = encryptionUtil.encrypt(password);

            Optional<UserCredentials> existingCreds = userCredentialsRepository.findByEmail(email);
            if (existingCreds.isPresent()) {
                // Update existing credentials
                userCreds = existingCreds.get();
                userCreds.setEncryptedPassword(encryptedPassword);
                userCreds.setLastConnectionAt(LocalDateTime.now());
                userCredentialsRepository.save(userCreds);
            } else {
                // Create new credentials entry
                userCreds = new UserCredentials(email, encryptedPassword);
                userCreds.setLastConnectionAt(LocalDateTime.now());
                userCredentialsRepository.save(userCreds);
            }
        } catch (Exception e) {
            System.err.println("Failed to store encrypted credentials: " + e.getMessage());
            // Don't fail the login if credential storage fails
        }

        // Generate short-lived access token (15 minutes)
        String accessToken = jwtTokenProvider.generateAccessToken(email);

        // Generate refresh token
        String refreshTokenValue = jwtTokenProvider.generateRefreshToken();

        // Calculate expiry date for refresh token (30 days)
        LocalDateTime expiryDate = LocalDateTime.now()
                .plusSeconds(jwtTokenProvider.getRefreshTokenExpirationTime() / 1000);

        // Save refresh token to database
        RefreshToken refreshToken = new RefreshToken(refreshTokenValue, email, expiryDate, deviceInfo);
        refreshTokenRepository.save(refreshToken);

        // Clean up old expired tokens for this user (optional housekeeping)
        cleanupExpiredTokens(email);

        // Get user role
        String role = (userCreds != null) ? userCreds.getRole() : "USER";

        return new LoginResponse(accessToken, refreshTokenValue, email, "Login successful", role);
    }

    /**
     * Logout user (close IMAP connection and optionally delete credentials)
     */
    public void logout(String email) {
        mailService.closeConnection(email);
        // Note: We keep encrypted credentials in DB for auto-reconnect
        // Only delete them if user explicitly requests account removal
    }

    /**
     * Validate JWT token
     */
    public boolean validateToken(String token) {
        return jwtTokenProvider.validateToken(token);
    }

    /**
     * Get email from JWT token
     */
    public String getEmailFromToken(String token) {
        return jwtTokenProvider.getEmailFromToken(token);
    }

    /**
     * Refresh access token using refresh token
     */
    @Transactional
    public LoginResponse refreshToken(String refreshTokenValue) {
        // Find refresh token in database
        Optional<RefreshToken> refreshTokenOpt = refreshTokenRepository.findByTokenAndRevoked(refreshTokenValue, false);

        if (refreshTokenOpt.isEmpty()) {
            throw new BadCredentialsException("Invalid refresh token");
        }

        RefreshToken refreshToken = refreshTokenOpt.get();

        if (!refreshToken.isValid()) {
            throw new BadCredentialsException("Refresh token expired or revoked");
        }

        String email = refreshToken.getUserEmail();

        // Generate new access token
        String newAccessToken = jwtTokenProvider.generateAccessToken(email);

        // Optionally rotate refresh token (recommended for security)
        String newRefreshTokenValue = jwtTokenProvider.generateRefreshToken();
        LocalDateTime expiryDate = LocalDateTime.now()
                .plusSeconds(jwtTokenProvider.getRefreshTokenExpirationTime() / 1000);

        // Revoke old refresh token
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        // Create new refresh token
        RefreshToken newRefreshToken = new RefreshToken(
                newRefreshTokenValue,
                email,
                expiryDate,
                refreshToken.getDeviceInfo()
        );
        refreshTokenRepository.save(newRefreshToken);

        // Get user role
        String role = userCredentialsRepository.findByEmail(email)
                .map(UserCredentials::getRole)
                .orElse("USER");

        return new LoginResponse(newAccessToken, newRefreshTokenValue, email, "Token refreshed successfully", role);
    }

    /**
     * Revoke refresh token (logout)
     */
    @Transactional
    public void revokeRefreshToken(String refreshTokenValue) {
        refreshTokenRepository.revokeByToken(refreshTokenValue);
    }

    /**
     * Revoke all refresh tokens for a user (logout from all devices)
     */
    @Transactional
    public void revokeAllRefreshTokens(String email) {
        refreshTokenRepository.revokeAllByUserEmail(email);
    }

    /**
     * Clean up expired tokens for a user
     */
    @Transactional
    public void cleanupExpiredTokens(String email) {
        refreshTokenRepository.deleteExpiredTokens(LocalDateTime.now());
    }

    /**
     * Check if token needs refresh (is about to expire)
     */
    public boolean isTokenAboutToExpire(String token) {
        return jwtTokenProvider.isTokenAboutToExpire(token);
    }

    /**
     * Request password reset - generates token and sends email
     */
    @Transactional
    public void requestPasswordReset(String email) {
        // Check if user exists
        Optional<UserCredentials> userOpt = userCredentialsRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // Don't reveal if email exists or not for security
            logger.warn("Password reset requested for non-existent email: {}", email);
            return;
        }

        // Delete any existing reset tokens for this user
        passwordResetTokenRepository.deleteByUserEmail(email);

        // Create new reset token
        PasswordResetToken resetToken = new PasswordResetToken(email, PASSWORD_RESET_TOKEN_EXPIRY_MINUTES);
        passwordResetTokenRepository.save(resetToken);

        // Send password reset email
        try {
            sendPasswordResetEmail(email, resetToken.getToken());
            logger.info("Password reset email sent to: {}", email);
        } catch (Exception e) {
            logger.error("Failed to send password reset email to: {}", email, e);
            throw new RuntimeException("Failed to send password reset email");
        }
    }

    /**
     * Reset password using token
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        // Find and validate token
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenAndUsed(token, false)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired reset token"));

        if (!resetToken.isValid()) {
            throw new BadCredentialsException("Reset token has expired");
        }

        // Validate new password
        String validationMessage = PasswordValidator.getValidationMessage(newPassword);
        if (validationMessage != null) {
            throw new IllegalArgumentException("Password validation failed: " + validationMessage);
        }

        // Get user
        UserCredentials user = userCredentialsRepository.findByEmail(resetToken.getUserEmail())
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        try {
            // Update password in Apache James
            boolean updated = mailService.updateJamesUserPassword(user.getEmail(), newPassword);
            if (!updated) {
                throw new RuntimeException("Failed to update password in mail server");
            }

            // Update encrypted password in database
            String encryptedPassword = encryptionUtil.encrypt(newPassword);
            user.setEncryptedPassword(encryptedPassword);
            user.setUpdatedAt(LocalDateTime.now());
            userCredentialsRepository.save(user);

            // Mark token as used
            resetToken.setUsed(true);
            passwordResetTokenRepository.save(resetToken);

            // Revoke all existing refresh tokens for security
            revokeAllRefreshTokens(user.getEmail());

            logger.info("Password reset successful for user: {}", user.getEmail());
        } catch (Exception e) {
            logger.error("Failed to reset password for user: {}", user.getEmail(), e);
            throw new RuntimeException("Failed to reset password: " + e.getMessage());
        }
    }

    /**
     * Send password reset email
     */
    private void sendPasswordResetEmail(String toEmail, String token) {
        String resetUrl = frontendUrl + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Password Reset Request - Memail");
        message.setText(String.format(
            "Hello,\n\n" +
            "You have requested to reset your password for your Memail account.\n\n" +
            "Please click the link below to reset your password:\n" +
            "%s\n\n" +
            "This link will expire in %d minutes.\n\n" +
            "If you did not request this password reset, please ignore this email.\n\n" +
            "Best regards,\n" +
            "Memail Team",
            resetUrl,
            PASSWORD_RESET_TOKEN_EXPIRY_MINUTES
        ));

        mailSender.send(message);
    }

    /**
     * Clean up expired password reset tokens
     */
    @Transactional
    public void cleanupExpiredPasswordResetTokens() {
        passwordResetTokenRepository.deleteExpiredTokens(LocalDateTime.now());
    }

    /**
     * Change password for authenticated user
     */
    @Transactional
    public void changePasswordForUser(String email, String newPassword) {
        // Validate new password
        String validationMessage = PasswordValidator.getValidationMessage(newPassword);
        if (validationMessage != null) {
            throw new IllegalArgumentException("Password validation failed: " + validationMessage);
        }

        // Get user
        UserCredentials user = userCredentialsRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        try {
            // Update password in Apache James
            boolean updated = mailService.updateJamesUserPassword(email, newPassword);
            if (!updated) {
                throw new RuntimeException("Failed to update password in mail server");
            }

            // Update encrypted password in database
            String encryptedPassword = encryptionUtil.encrypt(newPassword);
            user.setEncryptedPassword(encryptedPassword);
            user.setUpdatedAt(LocalDateTime.now());
            userCredentialsRepository.save(user);

            // Revoke all existing refresh tokens for security
            revokeAllRefreshTokens(email);

            logger.info("Password changed successfully for user: {}", email);
        } catch (Exception e) {
            logger.error("Failed to change password for user: {}", email, e);
            throw new RuntimeException("Failed to change password: " + e.getMessage());
        }
    }
}