package com.memail.service;

import com.memail.dto.LoginRequest;
import com.memail.dto.LoginResponse;
import com.memail.model.RefreshToken;
import com.memail.model.UserCredentials;
import com.memail.repository.RefreshTokenRepository;
import com.memail.repository.UserCredentialsRepository;
import com.memail.security.JwtTokenProvider;
import com.memail.util.EncryptionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private MailService mailService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserCredentialsRepository userCredentialsRepository;

    @Autowired
    private EncryptionUtil encryptionUtil;

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

        // Validate credentials against Apache James IMAP server
        boolean isAuthenticated = mailService.authenticateUser(email, password);

        if (!isAuthenticated) {
            throw new BadCredentialsException("Invalid email or password");
        }

        // Store encrypted IMAP credentials for session persistence across server restarts
        try {
            String encryptedPassword = encryptionUtil.encrypt(password);

            Optional<UserCredentials> existingCreds = userCredentialsRepository.findByEmail(email);
            if (existingCreds.isPresent()) {
                // Update existing credentials
                UserCredentials creds = existingCreds.get();
                creds.setEncryptedPassword(encryptedPassword);
                creds.setLastConnectionAt(LocalDateTime.now());
                userCredentialsRepository.save(creds);
            } else {
                // Create new credentials entry
                UserCredentials creds = new UserCredentials(email, encryptedPassword);
                creds.setLastConnectionAt(LocalDateTime.now());
                userCredentialsRepository.save(creds);
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

        return new LoginResponse(accessToken, refreshTokenValue, email, "Login successful");
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

        return new LoginResponse(newAccessToken, newRefreshTokenValue, email, "Token refreshed successfully");
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
}