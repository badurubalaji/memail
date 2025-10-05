package com.memail.dto;

import jakarta.validation.constraints.Pattern;

/**
 * Request DTO for updating a user (admin only)
 */
public class UpdateUserRequest {

    private String password; // Optional - only update if provided

    @Pattern(regexp = "USER|ADMIN", message = "Role must be either USER or ADMIN")
    private String role;

    private Boolean enabled;

    public UpdateUserRequest() {}

    public UpdateUserRequest(String password, String role, Boolean enabled) {
        this.password = password;
        this.role = role;
        this.enabled = enabled;
    }

    // Getters and Setters

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
}
