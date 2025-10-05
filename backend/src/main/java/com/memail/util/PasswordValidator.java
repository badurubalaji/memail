package com.memail.util;

import java.util.ArrayList;
import java.util.List;

/**
 * Password Complexity Validator
 * Enforces strong password requirements for security
 */
public class PasswordValidator {

    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 128;

    /**
     * Validates password against complexity requirements
     * @param password The password to validate
     * @return List of validation errors (empty if valid)
     */
    public static List<String> validate(String password) {
        List<String> errors = new ArrayList<>();

        if (password == null || password.isEmpty()) {
            errors.add("Password is required");
            return errors;
        }

        // Length check
        if (password.length() < MIN_LENGTH) {
            errors.add("Password must be at least " + MIN_LENGTH + " characters long");
        }

        if (password.length() > MAX_LENGTH) {
            errors.add("Password must not exceed " + MAX_LENGTH + " characters");
        }

        // Complexity checks
        boolean hasUpperCase = false;
        boolean hasLowerCase = false;
        boolean hasDigit = false;
        boolean hasSpecialChar = false;

        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) {
                hasUpperCase = true;
            } else if (Character.isLowerCase(c)) {
                hasLowerCase = true;
            } else if (Character.isDigit(c)) {
                hasDigit = true;
            } else if (isSpecialCharacter(c)) {
                hasSpecialChar = true;
            }
        }

        if (!hasUpperCase) {
            errors.add("Password must contain at least one uppercase letter");
        }

        if (!hasLowerCase) {
            errors.add("Password must contain at least one lowercase letter");
        }

        if (!hasDigit) {
            errors.add("Password must contain at least one digit");
        }

        if (!hasSpecialChar) {
            errors.add("Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)");
        }

        // Check for common weak passwords
        if (isCommonPassword(password)) {
            errors.add("Password is too common. Please choose a stronger password");
        }

        return errors;
    }

    /**
     * Checks if password meets complexity requirements
     */
    public static boolean isValid(String password) {
        return validate(password).isEmpty();
    }

    /**
     * Gets a user-friendly error message for password validation
     */
    public static String getValidationMessage(String password) {
        List<String> errors = validate(password);
        if (errors.isEmpty()) {
            return null;
        }
        return String.join(". ", errors);
    }

    /**
     * Checks if character is a special character
     */
    private static boolean isSpecialCharacter(char c) {
        String specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
        return specialChars.indexOf(c) >= 0;
    }

    /**
     * Checks if password is in common password list
     */
    private static boolean isCommonPassword(String password) {
        String[] commonPasswords = {
            "password", "12345678", "password1", "Password1", "qwerty123",
            "admin123", "welcome123", "letmein", "password123", "123456789"
        };

        String lowerPassword = password.toLowerCase();
        for (String common : commonPasswords) {
            if (lowerPassword.equals(common.toLowerCase())) {
                return true;
            }
        }
        return false;
    }

    /**
     * Password strength enum
     */
    public enum PasswordStrength {
        WEAK, MEDIUM, STRONG, VERY_STRONG
    }

    /**
     * Calculates password strength
     */
    public static PasswordStrength calculateStrength(String password) {
        if (password == null || password.isEmpty()) {
            return PasswordStrength.WEAK;
        }

        int score = 0;

        // Length score
        if (password.length() >= 8) score++;
        if (password.length() >= 12) score++;
        if (password.length() >= 16) score++;

        // Complexity score
        if (password.chars().anyMatch(Character::isUpperCase)) score++;
        if (password.chars().anyMatch(Character::isLowerCase)) score++;
        if (password.chars().anyMatch(Character::isDigit)) score++;
        if (password.chars().anyMatch(c -> isSpecialCharacter((char) c))) score++;

        // Diversity score
        long uniqueChars = password.chars().distinct().count();
        if (uniqueChars >= password.length() * 0.7) score++;

        if (score <= 3) return PasswordStrength.WEAK;
        if (score <= 5) return PasswordStrength.MEDIUM;
        if (score <= 7) return PasswordStrength.STRONG;
        return PasswordStrength.VERY_STRONG;
    }
}
