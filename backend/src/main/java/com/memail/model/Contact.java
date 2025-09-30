package com.memail.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "contacts",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_email", "contact_email"}))
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "contact_email", nullable = false)
    private String contactEmail;

    @Column(name = "contact_name")
    private String contactName;

    @Column(name = "frequency", nullable = false)
    private Integer frequency = 1;

    @Column(name = "last_contacted")
    private LocalDateTime lastContacted;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public Contact() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.lastContacted = LocalDateTime.now();
    }

    public Contact(String userEmail, String contactEmail) {
        this();
        this.userEmail = userEmail;
        this.contactEmail = contactEmail;
    }

    public Contact(String userEmail, String contactEmail, String contactName) {
        this(userEmail, contactEmail);
        this.contactName = contactName;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public Integer getFrequency() {
        return frequency;
    }

    public void setFrequency(Integer frequency) {
        this.frequency = frequency;
    }

    public LocalDateTime getLastContacted() {
        return lastContacted;
    }

    public void setLastContacted(LocalDateTime lastContacted) {
        this.lastContacted = lastContacted;
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

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void incrementFrequency() {
        this.frequency++;
        this.lastContacted = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}