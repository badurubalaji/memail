package com.memail.dto;

import java.util.List;

public class SendEmailRequestDTO {

    private String to;
    private String cc;
    private String bcc;
    private String subject;
    private String htmlContent;
    private List<FileAttachmentDTO> attachments;

    // Constructors
    public SendEmailRequestDTO() {}

    public SendEmailRequestDTO(String to, String cc, String bcc, String subject, String htmlContent) {
        this.to = to;
        this.cc = cc;
        this.bcc = bcc;
        this.subject = subject;
        this.htmlContent = htmlContent;
    }

    // Getters and Setters
    public String getTo() {
        return to;
    }

    public void setTo(String to) {
        this.to = to;
    }

    public String getCc() {
        return cc;
    }

    public void setCc(String cc) {
        this.cc = cc;
    }

    public String getBcc() {
        return bcc;
    }

    public void setBcc(String bcc) {
        this.bcc = bcc;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
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
}