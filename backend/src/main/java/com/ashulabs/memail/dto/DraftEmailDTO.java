package com.ashulabs.memail.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.List;
import com.memail.dto.FileAttachmentDTO;

public class DraftEmailDTO {

    @JsonProperty("messageId")
    private String messageId;

    @JsonProperty("to")
    private List<String> to;

    @JsonProperty("cc")
    private List<String> cc;

    @JsonProperty("bcc")
    private List<String> bcc;

    @JsonProperty("subject")
    private String subject;

    @JsonProperty("textContent")
    private String textContent;

    @JsonProperty("htmlContent")
    private String htmlContent;

    @JsonProperty("attachments")
    private List<FileAttachmentDTO> attachments;

    @JsonProperty("lastModified")
    private LocalDateTime lastModified;

    @JsonProperty("created")
    private LocalDateTime created;

    @JsonProperty("replyToMessageId")
    private String replyToMessageId;

    @JsonProperty("replyType")
    private String replyType; // "reply", "replyAll", "forward"

    @JsonProperty("threadId")
    private String threadId;

    @JsonProperty("folder")
    private String folder;

    // Constructors
    public DraftEmailDTO() {}

    public DraftEmailDTO(String messageId, List<String> to, List<String> cc, List<String> bcc, String subject,
                        String textContent, String htmlContent, List<FileAttachmentDTO> attachments,
                        LocalDateTime lastModified, LocalDateTime created, String replyToMessageId,
                        String replyType, String threadId, String folder) {
        this.messageId = messageId;
        this.to = to;
        this.cc = cc;
        this.bcc = bcc;
        this.subject = subject;
        this.textContent = textContent;
        this.htmlContent = htmlContent;
        this.attachments = attachments;
        this.lastModified = lastModified;
        this.created = created;
        this.replyToMessageId = replyToMessageId;
        this.replyType = replyType;
        this.threadId = threadId;
        this.folder = folder;
    }

    // Getters and Setters
    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

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

    public String getTextContent() {
        return textContent;
    }

    public void setTextContent(String textContent) {
        this.textContent = textContent;
    }

    public String getHtmlContent() {
        return htmlContent;
    }

    public void setHtmlContent(String htmlContent) {
        this.htmlContent = htmlContent;
    }

    public List<FileAttachmentDTO> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<FileAttachmentDTO> attachments) {
        this.attachments = attachments;
    }

    public LocalDateTime getLastModified() {
        return lastModified;
    }

    public void setLastModified(LocalDateTime lastModified) {
        this.lastModified = lastModified;
    }

    public LocalDateTime getCreated() {
        return created;
    }

    public void setCreated(LocalDateTime created) {
        this.created = created;
    }

    public String getReplyToMessageId() {
        return replyToMessageId;
    }

    public void setReplyToMessageId(String replyToMessageId) {
        this.replyToMessageId = replyToMessageId;
    }

    public String getReplyType() {
        return replyType;
    }

    public void setReplyType(String replyType) {
        this.replyType = replyType;
    }

    public String getThreadId() {
        return threadId;
    }

    public void setThreadId(String threadId) {
        this.threadId = threadId;
    }

    public String getFolder() {
        return folder;
    }

    public void setFolder(String folder) {
        this.folder = folder;
    }
}