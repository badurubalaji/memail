package com.memail.dto;

import java.util.List;

public class EmailActionRequest {
    private List<String> messageIds;
    private EmailAction action;
    private Long labelId; // For label actions
    private String folder; // For label actions (IMAP folder name)

    public enum EmailAction {
        MARK_AS_READ,
        MARK_AS_UNREAD,
        DELETE,
        ARCHIVE,
        APPLY_LABEL,
        REMOVE_LABEL,
        STAR,
        UNSTAR,
        MARK_IMPORTANT,
        UNMARK_IMPORTANT,
        MOVE_TO_SPAM,
        MOVE_TO_INBOX,
        MOVE_TO_TRASH
    }

    // Constructors
    public EmailActionRequest() {}

    public EmailActionRequest(List<String> messageIds, EmailAction action) {
        this.messageIds = messageIds;
        this.action = action;
    }

    // Getters and Setters
    public List<String> getMessageIds() {
        return messageIds;
    }

    public void setMessageIds(List<String> messageIds) {
        this.messageIds = messageIds;
    }

    public EmailAction getAction() {
        return action;
    }

    public void setAction(EmailAction action) {
        this.action = action;
    }

    public Long getLabelId() {
        return labelId;
    }

    public void setLabelId(Long labelId) {
        this.labelId = labelId;
    }

    public String getFolder() {
        return folder;
    }

    public void setFolder(String folder) {
        this.folder = folder;
    }
}