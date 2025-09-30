package com.memail.dto;

import java.time.LocalDateTime;

public class EmailHeaderDTO {

    private String messageId;
    private String from;
    private String subject;
    private LocalDateTime date;
    private boolean unread;
    private boolean hasAttachments;
    private String preview;
    private String threadId;
    private String inReplyTo;
    private String references;

    // Constructors
    public EmailHeaderDTO() {}

    public EmailHeaderDTO(String messageId, String from, String subject, LocalDateTime date, boolean unread) {
        this.messageId = messageId;
        this.from = from;
        this.subject = subject;
        this.date = date;
        this.unread = unread;
    }

    // Getters and Setters
    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public boolean isUnread() {
        return unread;
    }

    public void setUnread(boolean unread) {
        this.unread = unread;
    }

    public boolean isHasAttachments() {
        return hasAttachments;
    }

    public void setHasAttachments(boolean hasAttachments) {
        this.hasAttachments = hasAttachments;
    }

    public String getPreview() {
        return preview;
    }

    public void setPreview(String preview) {
        this.preview = preview;
    }

    public String getThreadId() {
        return threadId;
    }

    public void setThreadId(String threadId) {
        this.threadId = threadId;
    }

    public String getInReplyTo() {
        return inReplyTo;
    }

    public void setInReplyTo(String inReplyTo) {
        this.inReplyTo = inReplyTo;
    }

    public String getReferences() {
        return references;
    }

    public void setReferences(String references) {
        this.references = references;
    }
}