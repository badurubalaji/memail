package com.memail.service;

import com.memail.config.WebSocketConfig;
import com.memail.dto.EmailHeaderDTO;
import jakarta.mail.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@EnableAsync
public class EmailMonitorService {

    @Autowired
    private MailService mailService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private WebSocketConfig webSocketConfig;

    // Track last known message counts per user
    private final Map<String, Integer> lastMessageCounts = new ConcurrentHashMap<>();

    @Scheduled(fixedDelay = 10000) // Check every 10 seconds for more responsive updates
    public void monitorNewEmails() {
        try {
            // Get all actively connected users from WebSocket configuration
            Set<String> activeUsers = webSocketConfig.getActiveUsers();

            if (activeUsers.isEmpty()) {
                // No active users, no need to monitor
                return;
            }

            for (String userEmail : activeUsers) {
                checkForNewEmails(userEmail);
            }
        } catch (Exception e) {
            System.err.println("Error monitoring emails: " + e.getMessage());
        }
    }

    @Async
    public void checkForNewEmails(String userEmail) {
        try {
            Store store = mailService.getUserStore(userEmail);
            if (store == null || !store.isConnected()) {
                return;
            }

            Folder inbox = store.getFolder("INBOX");
            if (inbox != null && inbox.exists()) {
                inbox.open(Folder.READ_ONLY);

                int currentMessageCount = inbox.getMessageCount();
                Integer lastCount = lastMessageCounts.get(userEmail);

                if (lastCount == null) {
                    // First time checking, just store the count
                    lastMessageCounts.put(userEmail, currentMessageCount);
                } else if (currentMessageCount > lastCount) {
                    // New messages detected
                    int newMessageCount = currentMessageCount - lastCount;
                    System.out.println("Detected " + newMessageCount + " new messages for " + userEmail);

                    // Get the new messages (last N messages)
                    Message[] messages = inbox.getMessages(lastCount + 1, currentMessageCount);

                    for (Message message : messages) {
                        try {
                            EmailHeaderDTO header = mailService.convertToEmailHeaderDTO(message);
                            if (header != null) {
                                notificationService.sendNewEmailNotification(
                                    userEmail,
                                    header.getMessageId(),
                                    header.getFrom(),
                                    header.getSubject(),
                                    "INBOX",
                                    header.getPreview()
                                );
                            }
                        } catch (Exception e) {
                            System.err.println("Error processing new message: " + e.getMessage());
                        }
                    }

                    lastMessageCounts.put(userEmail, currentMessageCount);
                }

                inbox.close(false);
            }
        } catch (Exception e) {
            System.err.println("Error checking for new emails for " + userEmail + ": " + e.getMessage());
        }
    }

    public void resetMessageCount(String userEmail) {
        lastMessageCounts.remove(userEmail);
    }
}