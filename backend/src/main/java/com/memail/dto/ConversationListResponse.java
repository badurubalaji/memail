package com.memail.dto;

import java.util.List;

public class ConversationListResponse {
    private List<ConversationDTO> conversations;
    private int totalCount;
    private int page;
    private int size;
    private boolean hasMore;

    // Constructors
    public ConversationListResponse() {}

    public ConversationListResponse(List<ConversationDTO> conversations, int totalCount, int page, int size) {
        this.conversations = conversations;
        this.totalCount = totalCount;
        this.page = page;
        this.size = size;
        this.hasMore = (page + 1) * size < totalCount;
    }

    // Getters and Setters
    public List<ConversationDTO> getConversations() {
        return conversations;
    }

    public void setConversations(List<ConversationDTO> conversations) {
        this.conversations = conversations;
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