package com.memail.dto;

import java.time.LocalDateTime;

/**
 * DTO for user information (for admin viewing)
 */
public class UserDTO {
    private Long id;
    private String email;
    private String role;
    private Boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastConnectionAt;

    public UserDTO() {}

    public UserDTO(Long id, String email, String role, Boolean enabled,
                   LocalDateTime createdAt, LocalDateTime updatedAt, LocalDateTime lastConnectionAt) {
        this.id = id;
        this.email = email;
        this.role = role;
        this.enabled = enabled;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.lastConnectionAt = lastConnectionAt;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getLastConnectionAt() {
        return lastConnectionAt;
    }

    public void setLastConnectionAt(LocalDateTime lastConnectionAt) {
        this.lastConnectionAt = lastConnectionAt;
    }
}
