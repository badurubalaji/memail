package com.memail.controller;

import com.memail.dto.LoginRequest;
import com.memail.dto.LoginResponse;
import com.memail.dto.PasswordResetConfirm;
import com.memail.dto.PasswordResetRequest;
import com.memail.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * Login endpoint - authenticate against IMAP server
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            LoginResponse response = authService.login(loginRequest);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401)
                .body(Map.of(
                    "error", "Authentication failed",
                    "message", "Invalid email or password"
                ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Server error",
                    "message", "Unable to process login request"
                ));
        }
    }

    /**
     * Logout endpoint
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(Authentication authentication) {
        try {
            if (authentication != null && authentication.isAuthenticated()) {
                String email = (String) authentication.getPrincipal();
                authService.logout(email);
            }
            return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Server error",
                    "message", "Unable to process logout request"
                ));
        }
    }

    /**
     * Validate token endpoint
     */
    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            if (token == null || token.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("valid", false, "message", "Token is required"));
            }

            boolean isValid = authService.validateToken(token);
            if (isValid) {
                String email = authService.getEmailFromToken(token);
                boolean aboutToExpire = authService.isTokenAboutToExpire(token);
                return ResponseEntity.ok(Map.of(
                    "valid", true,
                    "email", email,
                    "aboutToExpire", aboutToExpire
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "valid", false,
                    "message", "Invalid or expired token"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "valid", false,
                    "message", "Unable to validate token"
                ));
        }
    }

    /**
     * Refresh access token using refresh token
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        try {
            String refreshToken = request.get("refreshToken");
            if (refreshToken == null || refreshToken.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of(
                        "error", "Bad request",
                        "message", "Refresh token is required"
                    ));
            }

            LoginResponse response = authService.refreshToken(refreshToken);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401)
                .body(Map.of(
                    "error", "Authentication failed",
                    "message", e.getMessage()
                ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Server error",
                    "message", "Unable to refresh token"
                ));
        }
    }

    /**
     * Revoke refresh token (logout from this device)
     */
    @PostMapping("/revoke")
    public ResponseEntity<?> revokeToken(@RequestBody Map<String, String> request) {
        try {
            String refreshToken = request.get("refreshToken");
            if (refreshToken == null || refreshToken.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of(
                        "error", "Bad request",
                        "message", "Refresh token is required"
                    ));
            }

            authService.revokeRefreshToken(refreshToken);
            return ResponseEntity.ok(Map.of("message", "Token revoked successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Server error",
                    "message", "Unable to revoke token"
                ));
        }
    }

    /**
     * Revoke all refresh tokens (logout from all devices)
     */
    @PostMapping("/revoke-all")
    public ResponseEntity<?> revokeAllTokens(Authentication authentication) {
        try {
            if (authentication != null && authentication.isAuthenticated()) {
                String email = (String) authentication.getPrincipal();
                authService.revokeAllRefreshTokens(email);
                authService.logout(email); // Also close IMAP connection
            }
            return ResponseEntity.ok(Map.of("message", "All tokens revoked successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Server error",
                    "message", "Unable to revoke tokens"
                ));
        }
    }

    /**
     * Request password reset - sends email with reset token
     */
    @PostMapping("/password-reset/request")
    public ResponseEntity<?> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        try {
            authService.requestPasswordReset(request.getEmail());
            // Always return success to prevent email enumeration attacks
            return ResponseEntity.ok(Map.of(
                "message", "If the email exists, a password reset link has been sent"
            ));
        } catch (Exception e) {
            // Log error but still return success message
            return ResponseEntity.ok(Map.of(
                "message", "If the email exists, a password reset link has been sent"
            ));
        }
    }

    /**
     * Reset password using token
     */
    @PostMapping("/password-reset/confirm")
    public ResponseEntity<?> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirm request) {
        try {
            authService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(Map.of(
                "message", "Password reset successful"
            ));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(400)
                .body(Map.of(
                    "error", "Invalid request",
                    "message", e.getMessage()
                ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400)
                .body(Map.of(
                    "error", "Validation error",
                    "message", e.getMessage()
                ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Server error",
                    "message", "Unable to reset password"
                ));
        }
    }

    /**
     * Change password for authenticated user
     */
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request, Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401)
                    .body(Map.of("error", "Unauthorized", "message", "User not authenticated"));
            }

            String email = (String) authentication.getPrincipal();
            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");

            if (currentPassword == null || newPassword == null) {
                return ResponseEntity.status(400)
                    .body(Map.of("error", "Bad request", "message", "Current and new passwords are required"));
            }

            // Verify current password by attempting login
            try {
                LoginRequest loginRequest = new LoginRequest();
                loginRequest.setEmail(email);
                loginRequest.setPassword(currentPassword);
                authService.login(loginRequest);
            } catch (BadCredentialsException e) {
                return ResponseEntity.status(400)
                    .body(Map.of("error", "Invalid password", "message", "Current password is incorrect"));
            }

            // Use password reset logic to update password
            authService.changePasswordForUser(email, newPassword);

            return ResponseEntity.ok(Map.of(
                "message", "Password changed successfully"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400)
                .body(Map.of(
                    "error", "Validation error",
                    "message", e.getMessage()
                ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Server error",
                    "message", "Unable to change password"
                ));
        }
    }
}