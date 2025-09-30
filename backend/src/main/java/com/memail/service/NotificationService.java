package com.memail.service;

import com.memail.dto.EmailNotificationDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendEmailNotification(String userEmail, EmailNotificationDTO notification) {
        // Send notification to specific user
        messagingTemplate.convertAndSendToUser(
            userEmail,
            "/queue/notifications",
            notification
        );
        System.out.println("Sent notification to user " + userEmail + ": " + notification.getType());
    }

    public void sendNewEmailNotification(String userEmail, String messageId, String from, String subject, String folder, String preview) {
        EmailNotificationDTO notification = new EmailNotificationDTO(
            "NEW_EMAIL", messageId, from, subject, folder, preview
        );
        sendEmailNotification(userEmail, notification);
    }

    public void sendEmailDeletedNotification(String userEmail, String messageId) {
        EmailNotificationDTO notification = new EmailNotificationDTO(
            "EMAIL_DELETED", messageId, null, null, null, null
        );
        sendEmailNotification(userEmail, notification);
    }

    public void sendEmailReadNotification(String userEmail, String messageId) {
        EmailNotificationDTO notification = new EmailNotificationDTO(
            "EMAIL_READ", messageId, null, null, null, null
        );
        sendEmailNotification(userEmail, notification);
    }
}