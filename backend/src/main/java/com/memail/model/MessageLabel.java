package com.memail.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "message_labels", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "message_uid", "folder", "label_id"})
})
public class MessageLabel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "message_uid", nullable = false)
    private String messageUid; // IMAP message UID

    @Column(name = "folder", nullable = false)
    private String folder; // IMAP folder name (INBOX, SENT, etc.)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "label_id", nullable = false)
    private Label label;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Default constructor
    public MessageLabel() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructor with parameters
    public MessageLabel(String userId, String messageUid, String folder, Label label) {
        this();
        this.userId = userId;
        this.messageUid = messageUid;
        this.folder = folder;
        this.label = label;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getMessageUid() {
        return messageUid;
    }

    public void setMessageUid(String messageUid) {
        this.messageUid = messageUid;
    }

    public String getFolder() {
        return folder;
    }

    public void setFolder(String folder) {
        this.folder = folder;
    }

    public Label getLabel() {
        return label;
    }

    public void setLabel(Label label) {
        this.label = label;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}