package com.ashulabs.memail.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import com.memail.dto.FileAttachmentDTO;

public class ReplyRequestDTO {

    @JsonProperty("to")
    @NotEmpty(message = "At least one recipient is required")
    private List<String> to;

    @JsonProperty("cc")
    private List<String> cc;

    @JsonProperty("bcc")
    private List<String> bcc;

    @JsonProperty("subject")
    @NotNull(message = "Subject is required")
    private String subject;

    @JsonProperty("body")
    @NotNull(message = "Message body is required")
    private String body;

    @JsonProperty("htmlContent")
    public void setHtmlContent(String htmlContent) {
        this.body = htmlContent; // Map htmlContent to body for backward compatibility
    }

    @JsonProperty("replyToMessageId")
    @NotNull(message = "Reply to message ID is required")
    private String replyToMessageId;

    @JsonProperty("originalMessageId")
    public void setOriginalMessageId(String originalMessageId) {
        this.replyToMessageId = originalMessageId; // Map originalMessageId to replyToMessageId
    }

    @JsonProperty("type")
    @NotNull(message = "Reply type is required")
    private String type; // "reply", "replyAll", "forward"

    @JsonProperty("folder")
    private String folder = "INBOX";

    @JsonProperty("attachments")
    private List<FileAttachmentDTO> attachments;

    @JsonProperty("saveDraft")
    private boolean saveDraft = false;

    @JsonProperty("scheduleTime")
    private String scheduleTime; // ISO date string for scheduled sending

    // Constructors
    public ReplyRequestDTO() {}

    public ReplyRequestDTO(List<String> to, List<String> cc, List<String> bcc, String subject, String body,
                          String replyToMessageId, String type, String folder, List<FileAttachmentDTO> attachments,
                          boolean saveDraft, String scheduleTime) {
        this.to = to;
        this.cc = cc;
        this.bcc = bcc;
        this.subject = subject;
        this.body = body;
        this.replyToMessageId = replyToMessageId;
        this.type = type;
        this.folder = folder;
        this.attachments = attachments;
        this.saveDraft = saveDraft;
        this.scheduleTime = scheduleTime;
    }

    // Getters and Setters
    public List<String> getTo() {
        return to;
    }

    public void setTo(List<String> to) {
        this.to = to;
    }

    public List<String> getCc() {
        return cc;
    }

    public void setCc(List<String> cc) {
        this.cc = cc;
    }

    public List<String> getBcc() {
        return bcc;
    }

    public void setBcc(List<String> bcc) {
        this.bcc = bcc;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public String getReplyToMessageId() {
        return replyToMessageId;
    }

    public void setReplyToMessageId(String replyToMessageId) {
        this.replyToMessageId = replyToMessageId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getFolder() {
        return folder;
    }

    public void setFolder(String folder) {
        this.folder = folder;
    }

    public List<FileAttachmentDTO> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<FileAttachmentDTO> attachments) {
        this.attachments = attachments;
    }

    public boolean isSaveDraft() {
        return saveDraft;
    }

    public void setSaveDraft(boolean saveDraft) {
        this.saveDraft = saveDraft;
    }

    public String getScheduleTime() {
        return scheduleTime;
    }

    public void setScheduleTime(String scheduleTime) {
        this.scheduleTime = scheduleTime;
    }
}