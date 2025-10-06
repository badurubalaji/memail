package com.memail.dto;

/**
 * DTO for user autocomplete/mention functionality
 * Contains only basic user information for email mentions
 */
public class UserAutocompleteDTO {
    private String email;
    private String displayName;
    private String firstName;
    private String lastName;

    public UserAutocompleteDTO() {
    }

    public UserAutocompleteDTO(String email, String firstName, String lastName) {
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.displayName = buildDisplayName(firstName, lastName, email);
    }

    private String buildDisplayName(String firstName, String lastName, String email) {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        } else if (lastName != null) {
            return lastName;
        }
        return email;
    }

    // Getters and Setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
}
