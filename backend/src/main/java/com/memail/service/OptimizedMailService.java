package com.memail.service;

import com.memail.dto.*;
import jakarta.mail.*;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

/**
 * Optimized mail operations with FetchProfile for better performance
 * This service uses batch operations and minimal data fetching
 */
@Service
public class OptimizedMailService {

    /**
     * Optimized email header conversion using FetchProfile
     * CRITICAL: Does NOT load message content - only headers
     */
    public EmailHeaderDTO convertToEmailHeaderDTOOptimized(Message message) {
        try {
            if (message.isSet(Flags.Flag.DELETED)) {
                return null;
            }

            EmailHeaderDTO dto = new EmailHeaderDTO();

            // Get subject (already fetched by FetchProfile)
            dto.setSubject(message.getSubject() != null ? message.getSubject() : "(No Subject)");

            // Get from address (already fetched)
            Address[] fromAddresses = message.getFrom();
            if (fromAddresses != null && fromAddresses.length > 0) {
                dto.setFrom(fromAddresses[0].toString());
            } else {
                dto.setFrom("Unknown Sender");
            }

            // Get date (already fetched)
            Date sentDate = message.getSentDate();
            if (sentDate != null) {
                dto.setDate(LocalDateTime.ofInstant(sentDate.toInstant(), ZoneId.systemDefault()));
            } else {
                dto.setDate(LocalDateTime.now());
            }

            // Get flags (already fetched)
            dto.setUnread(!message.isSet(Flags.Flag.SEEN));

            // Check for attachments using Content-Type header ONLY (no content loading)
            dto.setHasAttachments(hasAttachmentsOptimized(message));

            // Set empty preview initially - will be loaded lazily if needed
            dto.setPreview("");

            // Get Message-ID (already fetched)
            String[] messageIds = message.getHeader("Message-ID");
            if (messageIds != null && messageIds.length > 0) {
                dto.setMessageId(messageIds[0]);
            } else {
                dto.setMessageId("msg-" + message.getMessageNumber() + "-" + System.currentTimeMillis());
            }

            return dto;

        } catch (MessagingException e) {
            System.err.println("Error converting message: " + e.getMessage());
            return null;
        }
    }

    /**
     * Optimized attachment check - uses Content-Type header ONLY
     * Does NOT load message content
     */
    private boolean hasAttachmentsOptimized(Message message) {
        try {
            String[] contentType = message.getHeader("Content-Type");
            if (contentType != null && contentType.length > 0) {
                String type = contentType[0].toLowerCase();
                // Check if it's multipart/mixed which usually indicates attachments
                return type.contains("multipart/mixed") || type.contains("multipart/related");
            }
        } catch (Exception e) {
            // Ignore errors
        }
        return false;
    }

    /**
     * Apply FetchProfile to batch fetch message headers efficiently
     * This is CRITICAL for performance - fetches all data in one roundtrip
     */
    public void applyOptimizedFetchProfile(Folder folder, Message[] messages) throws MessagingException {
        FetchProfile fetchProfile = new FetchProfile();

        // Fetch envelope (From, To, Subject, Date)
        fetchProfile.add(FetchProfile.Item.ENVELOPE);

        // Fetch flags (Read/Unread, etc.)
        fetchProfile.add(FetchProfile.Item.FLAGS);

        // Fetch Content-Type header for attachment detection
        fetchProfile.add(FetchProfile.Item.CONTENT_INFO);

        // Fetch Message-ID and threading headers
        fetchProfile.add("Message-ID");
        fetchProfile.add("In-Reply-To");
        fetchProfile.add("References");

        // Execute batch fetch - ONE network roundtrip for ALL messages
        folder.fetch(messages, fetchProfile);
    }
}
