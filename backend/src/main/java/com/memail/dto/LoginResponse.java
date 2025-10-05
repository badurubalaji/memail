package com.memail.dto;

public class LoginResponse {

    private String token;
    private String refreshToken;
    private String email;
    private String message;
    private String role;

    // Constructors
    public LoginResponse() {}

    public LoginResponse(String token, String email) {
        this.token = token;
        this.email = email;
        this.message = "Login successful";
    }

    public LoginResponse(String token, String email, String message) {
        this.token = token;
        this.email = email;
        this.message = message;
    }

    public LoginResponse(String token, String refreshToken, String email, String message) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.email = email;
        this.message = message;
    }

    public LoginResponse(String token, String refreshToken, String email, String message, String role) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.email = email;
        this.message = message;
        this.role = role;
    }

    // Getters and Setters
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}