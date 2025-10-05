package com.memail.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Audit Logging Service
 * Logs all admin actions and security-critical operations for compliance
 */
@Service
public class AuditLogService {

    private static final Logger auditLogger = LoggerFactory.getLogger("com.memail.audit");
    private static final DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /**
     * Log admin action
     */
    public void logAdminAction(String adminEmail, String action, String targetUser, String details, boolean success) {
        Map<String, Object> auditData = new HashMap<>();
        auditData.put("timestamp", LocalDateTime.now().format(formatter));
        auditData.put("type", "ADMIN_ACTION");
        auditData.put("adminEmail", adminEmail);
        auditData.put("action", action);
        auditData.put("targetUser", targetUser);
        auditData.put("details", details);
        auditData.put("success", success);

        // Add to MDC for structured logging
        MDC.put("auditType", "ADMIN_ACTION");
        MDC.put("adminEmail", adminEmail);
        MDC.put("action", action);

        if (success) {
            auditLogger.info("Admin action: {} by {} on {} - {}", action, adminEmail, targetUser, details);
        } else {
            auditLogger.warn("Failed admin action: {} by {} on {} - {}", action, adminEmail, targetUser, details);
        }

        // Clear MDC
        MDC.clear();
    }

    /**
     * Log user creation
     */
    public void logUserCreated(String adminEmail, String newUserEmail, boolean success) {
        logAdminAction(adminEmail, "USER_CREATED", newUserEmail,
            "New user account created", success);
    }

    /**
     * Log user deletion
     */
    public void logUserDeleted(String adminEmail, String deletedUserEmail, boolean success) {
        logAdminAction(adminEmail, "USER_DELETED", deletedUserEmail,
            "User account deleted", success);
    }

    /**
     * Log user update
     */
    public void logUserUpdated(String adminEmail, String updatedUserEmail, String changes, boolean success) {
        logAdminAction(adminEmail, "USER_UPDATED", updatedUserEmail,
            "User account updated: " + changes, success);
    }

    /**
     * Log user enabled/disabled
     */
    public void logUserStatusChanged(String adminEmail, String targetUserEmail, boolean enabled, boolean success) {
        String action = enabled ? "USER_ENABLED" : "USER_DISABLED";
        String details = enabled ? "User account enabled" : "User account disabled";
        logAdminAction(adminEmail, action, targetUserEmail, details, success);
    }

    /**
     * Log role change
     */
    public void logRoleChanged(String adminEmail, String targetUserEmail, String oldRole, String newRole, boolean success) {
        String details = String.format("Role changed from %s to %s", oldRole, newRole);
        logAdminAction(adminEmail, "ROLE_CHANGED", targetUserEmail, details, success);
    }

    /**
     * Log authentication events
     */
    public void logAuthenticationEvent(String email, String eventType, boolean success, String details) {
        Map<String, Object> auditData = new HashMap<>();
        auditData.put("timestamp", LocalDateTime.now().format(formatter));
        auditData.put("type", "AUTHENTICATION");
        auditData.put("email", email);
        auditData.put("eventType", eventType);
        auditData.put("success", success);
        auditData.put("details", details);

        MDC.put("auditType", "AUTHENTICATION");
        MDC.put("email", email);
        MDC.put("eventType", eventType);

        if (success) {
            auditLogger.info("Authentication event: {} for {} - {}", eventType, email, details);
        } else {
            auditLogger.warn("Failed authentication: {} for {} - {}", eventType, email, details);
        }

        MDC.clear();
    }

    /**
     * Log password reset request
     */
    public void logPasswordResetRequested(String email, boolean success) {
        logAuthenticationEvent(email, "PASSWORD_RESET_REQUESTED", success,
            "Password reset token generated and sent");
    }

    /**
     * Log successful password reset
     */
    public void logPasswordReset(String email, boolean success) {
        logAuthenticationEvent(email, "PASSWORD_RESET", success,
            "Password successfully reset");
    }

    /**
     * Log failed login attempts
     */
    public void logFailedLogin(String email, String reason) {
        logAuthenticationEvent(email, "LOGIN_FAILED", false, reason);
    }

    /**
     * Log successful login
     */
    public void logSuccessfulLogin(String email, String ipAddress) {
        logAuthenticationEvent(email, "LOGIN_SUCCESS", true, "IP: " + ipAddress);
    }

    /**
     * Log security event
     */
    public void logSecurityEvent(String eventType, String subject, String details) {
        MDC.put("auditType", "SECURITY");
        MDC.put("eventType", eventType);
        MDC.put("subject", subject);

        auditLogger.warn("Security event: {} - Subject: {} - {}", eventType, subject, details);

        MDC.clear();
    }

    /**
     * Log rate limit exceeded
     */
    public void logRateLimitExceeded(String ipAddress, String endpoint) {
        logSecurityEvent("RATE_LIMIT_EXCEEDED", ipAddress,
            String.format("Rate limit exceeded for endpoint: %s", endpoint));
    }

    /**
     * Log suspicious activity
     */
    public void logSuspiciousActivity(String email, String activity, String details) {
        logSecurityEvent("SUSPICIOUS_ACTIVITY", email,
            String.format("Activity: %s - %s", activity, details));
    }
}
