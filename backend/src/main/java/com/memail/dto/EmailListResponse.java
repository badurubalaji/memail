package com.memail.dto;

import java.util.List;

public class EmailListResponse {

    private List<EmailHeaderDTO> emails;
    private int totalCount;
    private int page;
    private int size;
    private boolean hasMore;

    // Constructors
    public EmailListResponse() {}

    public EmailListResponse(List<EmailHeaderDTO> emails, int totalCount, int page, int size) {
        this.emails = emails;
        this.totalCount = totalCount;
        this.page = page;
        this.size = size;
        this.hasMore = (page + 1) * size < totalCount;
    }

    // Getters and Setters
    public List<EmailHeaderDTO> getEmails() {
        return emails;
    }

    public void setEmails(List<EmailHeaderDTO> emails) {
        this.emails = emails;
    }

    public int getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(int totalCount) {
        this.totalCount = totalCount;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public boolean isHasMore() {
        return hasMore;
    }

    public void setHasMore(boolean hasMore) {
        this.hasMore = hasMore;
    }
}