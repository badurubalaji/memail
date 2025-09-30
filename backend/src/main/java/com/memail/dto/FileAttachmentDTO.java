package com.memail.dto;

public class FileAttachmentDTO {

    private String fileName;
    private String contentType;
    private byte[] content;
    private long size;

    // Constructors
    public FileAttachmentDTO() {}

    public FileAttachmentDTO(String fileName, String contentType, byte[] content) {
        this.fileName = fileName;
        this.contentType = contentType;
        this.content = content;
        this.size = content != null ? content.length : 0;
    }

    // Getters and Setters
    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public byte[] getContent() {
        return content;
    }

    public void setContent(byte[] content) {
        this.content = content;
        this.size = content != null ? content.length : 0;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }
}