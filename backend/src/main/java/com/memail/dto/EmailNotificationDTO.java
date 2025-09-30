package com.memail.dto;

public class EmailNotificationDTO {
    private String type; // "NEW_EMAIL", "EMAIL_READ", "EMAIL_DELETED"
    private String messageId;
    private String from;
    private String subject;
    private String folder;
    private String preview;
    private long timestamp;

    public EmailNotificationDTO() {}

    public EmailNotificationDTO(String type, String messageId, String from, String subject, String folder, String preview) {
        this.type = type;
        this.messageId = messageId;
        this.from = from;
        this.subject = subject;
        this.folder = folder;
        this.preview = preview;
        this.timestamp = System.currentTimeMillis();
    }

    // Getters and setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }

    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getFolder() { return folder; }
    public void setFolder(String folder) { this.folder = folder; }

    public String getPreview() { return preview; }
    public void setPreview(String preview) { this.preview = preview; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}