package com.memail.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_preferences")
public class UserPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", unique = true, nullable = false)
    private String userEmail;

    @Column(name = "emails_per_page")
    private Integer emailsPerPage = 50;

    @Column(name = "theme")
    private String theme = "light";

    @Column(name = "conversation_view")
    private Boolean conversationView = true;

    @Column(name = "auto_mark_read")
    private Boolean autoMarkRead = true;

    @Column(name = "notification_sound")
    private Boolean notificationSound = true;

    @Column(name = "desktop_notifications")
    private Boolean desktopNotifications = true;

    @Column(name = "compact_view")
    private Boolean compactView = false;

    @Column(name = "preview_pane")
    private Boolean previewPane = true;

    @Column(name = "language")
    private String language = "en";

    @Column(name = "timezone")
    private String timezone = "UTC";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Constructors
    public UserPreferences() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public UserPreferences(String userEmail) {
        this();
        this.userEmail = userEmail;
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

    public Integer getEmailsPerPage() {
        return emailsPerPage;
    }

    public void setEmailsPerPage(Integer emailsPerPage) {
        this.emailsPerPage = emailsPerPage;
    }

    public String getTheme() {
        return theme;
    }

    public void setTheme(String theme) {
        this.theme = theme;
    }

    public Boolean getConversationView() {
        return conversationView;
    }

    public void setConversationView(Boolean conversationView) {
        this.conversationView = conversationView;
    }

    public Boolean getAutoMarkRead() {
        return autoMarkRead;
    }

    public void setAutoMarkRead(Boolean autoMarkRead) {
        this.autoMarkRead = autoMarkRead;
    }

    public Boolean getNotificationSound() {
        return notificationSound;
    }

    public void setNotificationSound(Boolean notificationSound) {
        this.notificationSound = notificationSound;
    }

    public Boolean getDesktopNotifications() {
        return desktopNotifications;
    }

    public void setDesktopNotifications(Boolean desktopNotifications) {
        this.desktopNotifications = desktopNotifications;
    }

    public Boolean getCompactView() {
        return compactView;
    }

    public void setCompactView(Boolean compactView) {
        this.compactView = compactView;
    }

    public Boolean getPreviewPane() {
        return previewPane;
    }

    public void setPreviewPane(Boolean previewPane) {
        this.previewPane = previewPane;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
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
}