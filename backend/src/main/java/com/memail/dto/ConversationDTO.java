package com.memail.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ConversationDTO {
    private String threadId;
    private String subject;
    private List<String> participants;
    private int messageCount;
    private LocalDateTime lastMessageDate;
    private boolean hasUnread;
    private boolean hasAttachments;
    private String preview;
    private List<EmailDetailDTO> messages;  // Changed from EmailHeaderDTO to EmailDetailDTO to include body

    // Constructors
    public ConversationDTO() {}

    public ConversationDTO(String threadId, String subject, List<String> participants,
                          int messageCount, LocalDateTime lastMessageDate,
                          boolean hasUnread, boolean hasAttachments, String preview) {
        this.threadId = threadId;
        this.subject = subject;
        this.participants = participants;
        this.messageCount = messageCount;
        this.lastMessageDate = lastMessageDate;
        this.hasUnread = hasUnread;
        this.hasAttachments = hasAttachments;
        this.preview = preview;
    }

    // Getters and Setters
    public String getThreadId() {
        return threadId;
    }

    public void setThreadId(String threadId) {
        this.threadId = threadId;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public List<String> getParticipants() {
        return participants;
    }

    public void setParticipants(List<String> participants) {
        this.participants = participants;
    }

    public int getMessageCount() {
        return messageCount;
    }

    public void setMessageCount(int messageCount) {
        this.messageCount = messageCount;
    }

    public LocalDateTime getLastMessageDate() {
        return lastMessageDate;
    }

    public void setLastMessageDate(LocalDateTime lastMessageDate) {
        this.lastMessageDate = lastMessageDate;
    }

    public boolean isHasUnread() {
        return hasUnread;
    }

    public void setHasUnread(boolean hasUnread) {
        this.hasUnread = hasUnread;
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

    public List<EmailDetailDTO> getMessages() {  // Changed return type
        return messages;
    }

    public void setMessages(List<EmailDetailDTO> messages) {  // Changed parameter type
        this.messages = messages;
    }
}