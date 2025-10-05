package com.memail.service;

import com.memail.dto.EmailHeaderDTO;
import com.memail.dto.EmailListResponse;
import com.memail.dto.SendEmailRequestDTO;
import com.memail.dto.FileAttachmentDTO;
import com.memail.dto.ConversationDTO;
import com.memail.dto.ConversationListResponse;
import com.memail.dto.EmailDetailDTO;
import com.memail.dto.EmailActionRequest;
import com.ashulabs.memail.dto.DraftEmailDTO;
import com.ashulabs.memail.dto.ReplyRequestDTO;
import com.memail.model.UserCredentials;
import com.memail.repository.UserCredentialsRepository;
import com.memail.util.EncryptionUtil;
import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.search.*;
import jakarta.activation.DataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.util.ByteArrayDataSource;
import jakarta.mail.internet.MimeMultipart;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.activation.DataHandler;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Date;
import java.util.Optional;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

@Service
public class MailService {

    @Autowired
    private JavaMailSender javaMailSender;

    @Autowired
    private LabelService labelService;

    @Autowired
    private UserCredentialsRepository userCredentialsRepository;

    @Autowired
    private EncryptionUtil encryptionUtil;

    @Autowired
    private OptimizedMailService optimizedMailService;

    @Value("${mail.imap.host}")
    private String imapHost;

    @Value("${mail.imap.port}")
    private int imapPort;

    @Value("${mail.imap.ssl.enable}")
    private boolean imapSslEnable;

    @Value("${mail.imap.starttls.enable}")
    private boolean imapStartTlsEnable;

    @Value("${james.webadmin.host}")
    private String jamesWebAdminHost;

    @Value("${james.webadmin.port}")
    private int jamesWebAdminPort;

    // SMTP configuration is now handled by Spring Boot's JavaMailSender
    // No need for separate SMTP configuration here

    private final Map<String, Store> userStores = new HashMap<>();
    // Remove userCredentials map as we no longer store user passwords

    /**
     * Authenticate user against IMAP server
     * Note: We only verify credentials during login, we do NOT store the password
     */
    public boolean authenticateUser(String email, String password) {
        System.out.println("=== ATTEMPTING IMAP AUTHENTICATION ===");
        System.out.println("Email: " + email);
        System.out.println("IMAP Host: " + imapHost + ":" + imapPort);
        System.out.println("SSL Enabled: " + imapSslEnable);
        System.out.println("STARTTLS Enabled: " + imapStartTlsEnable);

        try {
            Store store = connectToImapServer(email, password);
            if (store != null && store.isConnected()) {
                // Store the connection for later use (reading emails)
                userStores.put(email, store);
                // SECURITY: We do NOT store the password anymore
                System.out.println("=== AUTHENTICATION SUCCESSFUL ===");
                return true;
            }
        } catch (MessagingException e) {
            System.err.println("=== IMAP AUTHENTICATION FAILED ===");
            System.err.println("Error: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            if (e.getCause() != null) {
                System.err.println("Cause: " + e.getCause().getMessage());
            }
            e.printStackTrace();
        } catch (Exception e) {
            System.err.println("=== UNEXPECTED ERROR ===");
            System.err.println("Error: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
        }
        System.out.println("=== AUTHENTICATION FAILED ===");
        return false;
    }

    /**
     * Get emails from specified folder with pagination
     */
    public EmailListResponse getEmails(String email, String folderName, int page, int size) {
        try {
            Store store = getUserStore(email);
            if (store == null || !store.isConnected()) {
                throw new RuntimeException("User not authenticated or connection lost");
            }

            Folder folder = getFolderByName(store, folderName);
            if (folder == null) {
                throw new RuntimeException("Folder '" + folderName + "' not found");
            }

            folder.open(Folder.READ_ONLY);

            int messageCount = folder.getMessageCount();
            if (messageCount == 0) {
                return new EmailListResponse(Collections.emptyList(), 0, page, size);
            }

            // Calculate message range for pagination (newest first)
            int startIndex = Math.max(1, messageCount - (page + 1) * size + 1);
            int endIndex = Math.max(1, messageCount - page * size);

            Message[] messages = folder.getMessages(startIndex, endIndex);

            // PERFORMANCE OPTIMIZATION: Use FetchProfile to batch-fetch all headers in ONE network roundtrip
            // This is CRITICAL - without this, each message would trigger a separate server request
            long fetchStart = System.currentTimeMillis();
            optimizedMailService.applyOptimizedFetchProfile(folder, messages);
            long fetchTime = System.currentTimeMillis() - fetchStart;
            System.out.println("⚡ FetchProfile completed in " + fetchTime + "ms for " + messages.length + " messages");

            // Convert to DTOs and reverse order (newest first)
            List<EmailHeaderDTO> emailHeaders = Arrays.stream(messages)
                .map(this::convertToEmailHeaderDTO)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

            Collections.reverse(emailHeaders);

            folder.close(false);

            return new EmailListResponse(emailHeaders, messageCount, page, size);

        } catch (MessagingException e) {
            throw new RuntimeException("Failed to fetch emails: " + e.getMessage(), e);
        }
    }

    /**
     * Get user's IMAP store connection with auto-reconnect support
     * If the store is missing or disconnected, attempts to reconnect using stored credentials
     * This enables persistent sessions across server restarts
     */
    public Store getUserStore(String email) {
        Store store = userStores.get(email);

        // Check if store exists and is connected
        if (store != null && store.isConnected()) {
            return store;
        }

        // Store is missing or disconnected - attempt auto-reconnect
        System.out.println("=== AUTO-RECONNECT: IMAP store not found or disconnected for user: " + email + " ===");

        try {
            // Retrieve encrypted credentials from database
            Optional<UserCredentials> credentialsOpt = userCredentialsRepository.findByEmail(email);

            if (credentialsOpt.isEmpty()) {
                System.err.println("No stored credentials found for user: " + email);
                return null;
            }

            UserCredentials credentials = credentialsOpt.get();

            // Decrypt password
            String password = encryptionUtil.decrypt(credentials.getEncryptedPassword());

            // Reconnect to IMAP server
            System.out.println("Attempting to reconnect to IMAP server for user: " + email);
            Store reconnectedStore = connectToImapServer(email, password);

            if (reconnectedStore != null && reconnectedStore.isConnected()) {
                // Store the reconnected store
                userStores.put(email, reconnectedStore);

                // Update last connection time
                credentials.setLastConnectionAt(LocalDateTime.now());
                userCredentialsRepository.save(credentials);

                System.out.println("=== AUTO-RECONNECT SUCCESSFUL for user: " + email + " ===");
                return reconnectedStore;
            }

        } catch (Exception e) {
            System.err.println("Auto-reconnect failed for user " + email + ": " + e.getMessage());
            e.printStackTrace();
        }

        return null;
    }

    /**
     * Get folder by name with fallback to alternative names
     */
    private Folder getFolderByName(Store store, String folderName) throws MessagingException {
        // First try the exact folder name
        Folder folder = store.getFolder(folderName);
        if (folder.exists()) {
            return folder;
        }

        // If not found, try alternative names based on common IMAP folder conventions
        String[] alternatives = getAlternativeFolderNames(folderName);
        for (String alternative : alternatives) {
            folder = store.getFolder(alternative);
            if (folder.exists()) {
                System.out.println("Found folder '" + folderName + "' as '" + alternative + "'");
                return folder;
            }
        }

        // Try to create standard folders if they don't exist
        if (isStandardFolder(folderName)) {
            try {
                System.out.println("Creating missing standard folder: " + folderName);
                Folder newFolder = store.getFolder(folderName);
                if (newFolder.create(Folder.HOLDS_MESSAGES)) {
                    System.out.println("Successfully created folder: " + folderName);
                    return newFolder;
                }
            } catch (Exception e) {
                System.err.println("Failed to create folder '" + folderName + "': " + e.getMessage());
            }
        }

        // List available folders for debugging
        System.err.println("Folder '" + folderName + "' not found. Available folders:");
        try {
            Folder[] folders = store.getDefaultFolder().list("*");
            for (Folder f : folders) {
                System.err.println("  - " + f.getName() + " (full name: " + f.getFullName() + ")");
            }
        } catch (Exception e) {
            System.err.println("Could not list folders: " + e.getMessage());
        }

        return null; // Folder not found
    }

    /**
     * Check if a folder is a standard IMAP folder that should be auto-created
     */
    private boolean isStandardFolder(String folderName) {
        return folderName != null && (
            folderName.equalsIgnoreCase("DRAFTS") ||
            folderName.equalsIgnoreCase("SENT") ||
            folderName.equalsIgnoreCase("TRASH") ||
            folderName.equalsIgnoreCase("STARRED") ||
            folderName.equalsIgnoreCase("IMPORTANT") ||
            folderName.equalsIgnoreCase("SPAM")
        );
    }

    /**
     * Initialize default folders for user if they don't exist
     * Creates: DRAFTS, SENT, TRASH, STARRED, IMPORTANT, SPAM
     */
    public void initializeDefaultFolders(String email) {
        try {
            Store store = getUserStore(email);
            if (store == null || !store.isConnected()) {
                System.err.println("Cannot initialize folders - user not connected: " + email);
                return;
            }

            String[] defaultFolders = {"DRAFTS", "SENT", "TRASH", "STARRED", "IMPORTANT", "SPAM"};

            for (String folderName : defaultFolders) {
                try {
                    Folder folder = store.getFolder(folderName);
                    if (!folder.exists()) {
                        if (folder.create(Folder.HOLDS_MESSAGES)) {
                            System.out.println("✅ Created default folder: " + folderName + " for user: " + email);
                        } else {
                            System.err.println("❌ Failed to create folder: " + folderName);
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Error creating folder " + folderName + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to initialize default folders: " + e.getMessage());
        }
    }

    /**
     * Get alternative folder names for common IMAP folder types
     */
    private String[] getAlternativeFolderNames(String folderName) {
        switch (folderName.toUpperCase()) {
            case "SENT":
                return new String[]{"Sent", "Sent Items", "Sent Messages", "SENT"};
            case "DRAFTS":
                return new String[]{"Drafts", "Draft", "DRAFTS"};
            case "TRASH":
                return new String[]{"Trash", "Deleted", "Deleted Items", "TRASH"};
            case "INBOX":
                return new String[]{"INBOX", "Inbox"};
            case "STARRED":
                return new String[]{"Starred", "STARRED", "Star"};
            case "IMPORTANT":
                return new String[]{"Important", "IMPORTANT"};
            case "SPAM":
                return new String[]{"Spam", "SPAM", "Junk", "Junk Email"};
            default:
                return new String[]{folderName};
        }
    }

    /**
     * Connect to IMAP server
     */
    private Store connectToImapServer(String email, String password) throws MessagingException {
        Properties props = new Properties();
        props.setProperty("mail.store.protocol", "imap");
        props.setProperty("mail.imap.host", imapHost);
        props.setProperty("mail.imap.port", String.valueOf(imapPort));
        props.setProperty("mail.imap.ssl.enable", String.valueOf(imapSslEnable));
        props.setProperty("mail.imap.starttls.enable", String.valueOf(imapStartTlsEnable));

        // Additional properties for Apache James Docker compatibility
        props.setProperty("mail.imap.connectionpoolsize", "10");
        props.setProperty("mail.imap.connectionpooltimeout", "300000");
        props.setProperty("mail.imap.timeout", "30000");
        props.setProperty("mail.imap.connectiontimeout", "30000");

        // Enhanced SSL/TLS configuration for Docker James
        if (imapStartTlsEnable || imapSslEnable) {
            // Trust all certificates for development (James Docker uses self-signed)
            props.setProperty("mail.imap.ssl.trust", "*");
            props.setProperty("mail.imap.starttls.required", "false");
            props.setProperty("mail.imap.ssl.checkserveridentity", "false");
            props.setProperty("mail.imap.ssl.protocols", "TLSv1.2 TLSv1.3");
        }

        // Allow plain authentication for development
        props.setProperty("mail.imap.auth.plain.disable", "false");
        props.setProperty("mail.imap.auth.login.disable", "false");

        // Enable debug mode for troubleshooting
        props.setProperty("mail.debug", "true");

        System.out.println("=== IMAP CONNECTION PROPERTIES ===");
        props.forEach((key, value) -> System.out.println(key + " = " + value));

        System.out.println("Creating IMAP session and connecting...");

        Session session = Session.getInstance(props);
        session.setDebug(true); // Enable JavaMail debug output

        Store store = session.getStore("imap");

        System.out.println("Attempting to connect to IMAP server...");
        store.connect(imapHost, imapPort, email, password);

        System.out.println("Successfully connected to IMAP server for user: " + email);
        return store;
    }

    /**
     * Convert Message to EmailHeaderDTO
     */
    /**
     * Close IMAP connection for user
     */
    public void closeConnection(String email) {
        Store store = userStores.get(email);
        if (store != null && store.isConnected()) {
            try {
                store.close();
                userStores.remove(email);
                System.out.println("Closed IMAP connection for user: " + email);
            } catch (MessagingException e) {
                System.err.println("Error closing IMAP connection for user " + email + ": " + e.getMessage());
            }
        }
    }

    /**
     * Convert Message to EmailHeaderDTO
     */
    public EmailHeaderDTO convertToEmailHeaderDTO(Message message) {
        try {
            // Skip deleted messages
            if (message.isSet(Flags.Flag.DELETED)) {
                return null;
            }

            EmailHeaderDTO dto = new EmailHeaderDTO();

            // Extract basic information
            dto.setSubject(message.getSubject() != null ? message.getSubject() : "(No Subject)");

            // Extract sender information
            Address[] fromAddresses = message.getFrom();
            if (fromAddresses != null && fromAddresses.length > 0) {
                if (fromAddresses[0] instanceof InternetAddress) {
                    InternetAddress from = (InternetAddress) fromAddresses[0];
                    String personal = from.getPersonal();
                    if (personal != null && !personal.isEmpty()) {
                        dto.setFrom(personal + " <" + from.getAddress() + ">");
                    } else {
                        dto.setFrom(from.getAddress());
                    }
                } else {
                    dto.setFrom(fromAddresses[0].toString());
                }
            } else {
                dto.setFrom("Unknown Sender");
            }

            // Extract date
            Date sentDate = message.getSentDate();
            if (sentDate != null) {
                dto.setDate(LocalDateTime.ofInstant(sentDate.toInstant(), ZoneId.systemDefault()));
            } else {
                Date receivedDate = message.getReceivedDate();
                if (receivedDate != null) {
                    dto.setDate(LocalDateTime.ofInstant(receivedDate.toInstant(), ZoneId.systemDefault()));
                } else {
                    dto.setDate(LocalDateTime.now());
                }
            }

            // Check if message is unread
            dto.setUnread(!message.isSet(Flags.Flag.SEEN));

            // Check for attachments
            dto.setHasAttachments(hasAttachments(message));

            // Extract preview text
            dto.setPreview(extractPreview(message));

            // Generate a unique message ID
            String[] messageIds = message.getHeader("Message-ID");
            if (messageIds != null && messageIds.length > 0) {
                dto.setMessageId(messageIds[0]);
            } else {
                dto.setMessageId("msg-" + message.getMessageNumber() + "-" + System.currentTimeMillis());
            }

            return dto;

        } catch (MessagingException e) {
            System.err.println("Error converting message to DTO: " + e.getMessage());
            return null;
        }
    }

    /**
     * Check if message has attachments - OPTIMIZED VERSION
     * Uses Content-Type header only, does NOT load message content
     */
    private boolean hasAttachments(Message message) {
        try {
            String[] contentType = message.getHeader("Content-Type");
            if (contentType != null && contentType.length > 0) {
                String type = contentType[0].toLowerCase();
                return type.contains("multipart/mixed") || type.contains("multipart/related");
            }
        } catch (Exception e) {
            // Ignore errors
        }
        return false;
    }

    /**
     * Extract preview text from message - LAZY LOADED
     * Returns empty string for list view, only loads on detail view
     */
    private String extractPreview(Message message) {
        // PERFORMANCE: Don't load content for list view
        // Preview will be loaded lazily when needed
        return "";
    }

    /**
     * Extract full content from message (for draft editing, no truncation)
     */
    private String extractFullContent(Message message) {
        try {
            if (message.isMimeType("text/html")) {
                return (String) message.getContent();
            } else if (message.isMimeType("text/plain")) {
                return (String) message.getContent();
            } else if (message.isMimeType("multipart/*")) {
                Multipart multipart = (Multipart) message.getContent();
                return getFullContentFromMultipart(multipart);
            }
        } catch (Exception e) {
            System.err.println("ERROR extracting full content: " + e.getMessage());
        }
        return "";
    }

    /**
     * Extract full content from multipart message
     */
    private String getFullContentFromMultipart(Multipart multipart) throws MessagingException {
        StringBuilder result = new StringBuilder();
        try {
            for (int i = 0; i < multipart.getCount(); i++) {
                BodyPart bodyPart = multipart.getBodyPart(i);
                if (bodyPart.isMimeType("text/html")) {
                    return bodyPart.getContent().toString(); // Prefer HTML
                } else if (bodyPart.isMimeType("text/plain")) {
                    result.append(bodyPart.getContent().toString());
                } else if (bodyPart.isMimeType("multipart/*")) {
                    result.append(getFullContentFromMultipart((Multipart) bodyPart.getContent()));
                }
            }
        } catch (Exception e) {
            System.err.println("ERROR extracting multipart content: " + e.getMessage());
        }
        return result.toString();
    }

    /**
     * Extract text content from message
     */
    private String getTextContent(Message message) throws MessagingException {
        try {
            System.out.println("Getting text content for message: " + message.getSubject());
            System.out.println("Message mime type: " + message.getContentType());

            if (message.isMimeType("text/plain")) {
                String content = (String) message.getContent();
                System.out.println("Plain text content length: " + (content != null ? content.length() : 0));
                return content;
            } else if (message.isMimeType("text/html")) {
                String html = (String) message.getContent();
                System.out.println("HTML content length: " + (html != null ? html.length() : 0));
                // Enhanced HTML to text conversion
                String textFromHtml = htmlToText(html);
                System.out.println("Converted text length: " + (textFromHtml != null ? textFromHtml.length() : 0));
                return textFromHtml;
            } else if (message.isMimeType("multipart/*")) {
                Multipart multipart = (Multipart) message.getContent();
                String textFromMultipart = getTextFromMultipart(multipart);
                System.out.println("Multipart text content length: " + (textFromMultipart != null ? textFromMultipart.length() : 0));
                return textFromMultipart;
            }
        } catch (Exception e) {
            System.err.println("ERROR extracting text content: " + e.getMessage());
            e.printStackTrace();
        }
        System.out.println("Returning empty string for message content");
        return "";
    }

    /**
     * Extract text from multipart message
     */
    private String getTextFromMultipart(Multipart multipart) throws MessagingException {
        StringBuilder result = new StringBuilder();
        try {
            System.out.println("Processing multipart with " + multipart.getCount() + " parts");

            for (int i = 0; i < multipart.getCount(); i++) {
                BodyPart bodyPart = multipart.getBodyPart(i);
                String contentType = bodyPart.getContentType();
                System.out.println("Part " + i + " content type: " + contentType);

                if (bodyPart.isMimeType("text/plain")) {
                    String content = bodyPart.getContent().toString();
                    System.out.println("Found text/plain part with length: " + content.length());
                    result.append(content);
                    break; // Prefer plain text over HTML
                } else if (bodyPart.isMimeType("text/html") && result.length() == 0) {
                    String html = bodyPart.getContent().toString();
                    System.out.println("Found text/html part with length: " + html.length());
                    result.append(htmlToText(html));
                } else if (bodyPart.isMimeType("multipart/*")) {
                    // Handle nested multipart
                    System.out.println("Found nested multipart, recursing...");
                    Multipart nestedMultipart = (Multipart) bodyPart.getContent();
                    String nestedText = getTextFromMultipart(nestedMultipart);
                    if (nestedText != null && !nestedText.trim().isEmpty()) {
                        result.append(nestedText);
                        if (result.length() > 0) break; // Stop if we found content
                    }
                } else {
                    System.out.println("Skipping part with content type: " + contentType);
                }
            }
        } catch (Exception e) {
            System.err.println("ERROR in getTextFromMultipart: " + e.getMessage());
            e.printStackTrace();
        }

        String finalResult = result.toString();
        System.out.println("getTextFromMultipart returning content length: " + finalResult.length());
        return finalResult;
    }

    /**
     * Enhanced HTML to text conversion
     */
    private String htmlToText(String html) {
        if (html == null || html.trim().isEmpty()) {
            return "";
        }

        // Handle HTML entities first
        String text = html
            .replaceAll("&nbsp;", " ")
            .replaceAll("&amp;", "&")
            .replaceAll("&lt;", "<")
            .replaceAll("&gt;", ">")
            .replaceAll("&quot;", "\"")
            .replaceAll("&#39;", "'")
            .replaceAll("&apos;", "'");

        // Add line breaks for block elements
        text = text
            .replaceAll("(?i)</(div|p|br|h[1-6]|ul|ol|li|tr|td|th)>", "\n")
            .replaceAll("(?i)<br\\s*/?>", "\n")
            .replaceAll("(?i)<hr\\s*/?>", "\n---\n");

        // Remove all HTML tags
        text = text.replaceAll("<[^>]+>", "");

        // Clean up whitespace
        text = text
            .replaceAll("\\s*\\n\\s*", "\n")  // Remove spaces around newlines
            .replaceAll("\\n{3,}", "\n\n")   // Limit consecutive newlines to 2
            .replaceAll("[ \\t]{2,}", " ")   // Replace multiple spaces/tabs with single space
            .trim();

        return text;
    }

    /**
     * Send email using Spring's JavaMailSender (secure centralized SMTP)
     * The application uses its own configured credentials to send emails on behalf of users
     *
     * @param userEmail The authenticated user's email (from JWT/SecurityContext) - used as "From" address
     * @param sendRequest The email content and recipients
     * @throws MessagingException if email sending fails
     */
    public void sendEmail(String userEmail, SendEmailRequestDTO sendRequest) throws MessagingException {
        System.out.println("=== ATTEMPTING SECURE EMAIL SEND ===");
        System.out.println("On behalf of user: " + userEmail);
        System.out.println("To: " + sendRequest.getTo());
        System.out.println("Subject: " + sendRequest.getSubject());
        System.out.println("Using application's centralized SMTP credentials");

        try {
            // Create MimeMessage using Spring's JavaMailSender
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // CRITICAL: Set the "From" address to the authenticated user's email
            // This ensures the email appears to come from the correct user
            helper.setFrom(userEmail);
            helper.setSubject(sendRequest.getSubject());

            // Set recipients
            if (sendRequest.getTo() != null && !sendRequest.getTo().trim().isEmpty()) {
                helper.setTo(InternetAddress.parse(sendRequest.getTo()));
            }

            if (sendRequest.getCc() != null && !sendRequest.getCc().trim().isEmpty()) {
                helper.setCc(InternetAddress.parse(sendRequest.getCc()));
            }

            if (sendRequest.getBcc() != null && !sendRequest.getBcc().trim().isEmpty()) {
                helper.setBcc(InternetAddress.parse(sendRequest.getBcc()));
            }

            // Set HTML content
            helper.setText(sendRequest.getHtmlContent(), true);

            // Add attachments if any
            if (sendRequest.getAttachments() != null && !sendRequest.getAttachments().isEmpty()) {
                for (FileAttachmentDTO attachment : sendRequest.getAttachments()) {
                    DataSource source = new ByteArrayDataSource(
                        attachment.getContent(),
                        attachment.getContentType()
                    );
                    helper.addAttachment(attachment.getFileName(), source);
                }
            }

            // Send the email using Spring's JavaMailSender
            // This automatically uses the credentials configured in application.properties
            javaMailSender.send(message);

            System.out.println("=== EMAIL SENT SUCCESSFULLY (SECURE) ===");

            // Save to sent folder (best effort, don't fail if this fails)
            try {
                saveSentEmailSecure(userEmail, message);
            } catch (Exception e) {
                System.err.println("Warning: Could not save to sent folder: " + e.getMessage());
            }

        } catch (MessagingException e) {
            System.err.println("=== SECURE SMTP SEND FAILED ===");
            System.err.println("Error: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            if (e.getCause() != null) {
                System.err.println("Cause: " + e.getCause().getMessage());
            }
            e.printStackTrace();
            throw e;
        } catch (Exception e) {
            System.err.println("=== UNEXPECTED ERROR DURING SECURE SEND ===");
            System.err.println("Error: " + e.getClass().getSimpleName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            throw new MessagingException("Unexpected error during secure email send", e);
        }
    }

    /**
     * Save sent email to SENT folder using secure approach
     */
    private void saveSentEmailSecure(String userEmail, MimeMessage sentMessage) throws MessagingException {
        Store store = getUserStore(userEmail);
        if (store == null || !store.isConnected()) {
            System.err.println("Cannot save sent email: User not connected to IMAP");
            return;
        }

        try {
            // Open the SENT folder using the same logic as getEmails
            Folder sentFolder = getFolderByName(store, "SENT");

            if (sentFolder != null && sentFolder.exists()) {
                sentFolder.open(Folder.READ_WRITE);

                // Create a copy of the message for the sent folder
                MimeMessage sentCopy = new MimeMessage(sentMessage);
                sentCopy.setFlag(Flags.Flag.SEEN, true); // Mark as read in sent folder

                // Append to sent folder
                sentFolder.appendMessages(new Message[]{sentCopy});
                sentFolder.close(false);

                System.out.println("Successfully saved email to SENT folder");
            } else {
                System.err.println("SENT folder not found for user: " + userEmail);
            }
        } catch (Exception e) {
            System.err.println("Error saving to SENT folder: " + e.getMessage());
            // Don't throw exception - this is best effort
        }
    }

    /**
     * Get conversations from specified folder with pagination
     */
    public ConversationListResponse getConversations(String email, String folderName, int page, int size) {
        try {
            Store store = getUserStore(email);
            if (store == null || !store.isConnected()) {
                throw new RuntimeException("User not authenticated or connection lost");
            }

            Folder folder = getFolderByName(store, folderName);
            if (folder == null) {
                throw new RuntimeException("Folder '" + folderName + "' not found");
            }

            folder.open(Folder.READ_ONLY);

            int messageCount = folder.getMessageCount();
            if (messageCount == 0) {
                return new ConversationListResponse(Collections.emptyList(), 0, page, size);
            }

            // Fetch a larger batch for conversation grouping (up to 500 messages)
            int batchSize = Math.min(500, messageCount);
            int startIndex = Math.max(1, messageCount - batchSize + 1);
            int endIndex = messageCount;

            Message[] messages = folder.getMessages(startIndex, endIndex);

            // Convert to DTOs with threading information
            List<EmailHeaderDTO> emailHeaders = Arrays.stream(messages)
                .map(this::convertToEmailHeaderDTOWithThreading)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

            // Group into conversations
            List<ConversationDTO> conversations = groupIntoConversations(emailHeaders);

            // Sort by last message date (newest first)
            conversations.sort((a, b) -> b.getLastMessageDate().compareTo(a.getLastMessageDate()));

            // Apply pagination to conversations
            int totalConversations = conversations.size();
            int conversationStartIndex = page * size;
            int conversationEndIndex = Math.min(conversationStartIndex + size, totalConversations);

            List<ConversationDTO> paginatedConversations = conversations.subList(conversationStartIndex, conversationEndIndex);

            folder.close(false);

            return new ConversationListResponse(paginatedConversations, totalConversations, page, size);

        } catch (MessagingException e) {
            throw new RuntimeException("Failed to fetch conversations: " + e.getMessage(), e);
        }
    }

    /**
     * Get full conversation thread by thread ID
     */
    public ConversationDTO getConversationThread(String email, String threadId) {
        try {
            Store store = getUserStore(email);
            if (store == null || !store.isConnected()) {
                throw new RuntimeException("User not authenticated or connection lost");
            }

            // Search in all folders for the conversation but filter more strictly
            List<EmailDetailDTO> allMessages = new ArrayList<>();
            Set<String> processedMessageIds = new HashSet<>();

            for (String folderName : Arrays.asList("INBOX", "SENT", "DRAFTS", "TRASH", "STARRED", "IMPORTANT", "SPAM")) {
                Folder folder = getFolderByName(store, folderName);
                if (folder != null && folder.exists()) {
                    folder.open(Folder.READ_ONLY);

                    Message[] messages = folder.getMessages();
                    for (Message message : messages) {
                        EmailHeaderDTO header = convertToEmailHeaderDTOWithThreading(message);
                        if (header != null && threadId.equals(header.getThreadId())) {
                            // Avoid duplicate messages by checking Message-ID
                            String messageId = header.getMessageId();
                            if (messageId != null && !processedMessageIds.contains(messageId)) {
                                EmailDetailDTO detail = convertToEmailDetailDTO(message);
                                if (detail != null) {
                                    allMessages.add(detail);
                                    processedMessageIds.add(messageId);
                                    System.out.println("Added message to conversation: " + messageId + " from folder: " + folderName);
                                }
                            } else {
                                System.out.println("Skipping duplicate message: " + messageId);
                            }
                        }
                    }

                    folder.close(false);
                }
            }

            if (allMessages.isEmpty()) {
                throw new RuntimeException("Conversation not found: " + threadId);
            }

            // Sort messages by date
            allMessages.sort((a, b) -> a.getDate().compareTo(b.getDate()));

            // Create conversation DTO
            ConversationDTO conversation = new ConversationDTO();
            conversation.setThreadId(threadId);
            conversation.setSubject(allMessages.get(0).getSubject());
            conversation.setMessageCount(allMessages.size());
            conversation.setLastMessageDate(allMessages.get(allMessages.size() - 1).getDate());

            // Extract participants
            Set<String> participantSet = new HashSet<>();
            boolean hasUnread = false;
            boolean hasAttachments = false;

            for (EmailDetailDTO msg : allMessages) {
                participantSet.add(extractEmailAddress(msg.getFrom()));
                if (msg.getTo() != null) {
                    Arrays.stream(msg.getTo().split("[,;]"))
                        .map(String::trim)
                        .forEach(addr -> participantSet.add(extractEmailAddress(addr)));
                }
                if (msg.isUnread()) hasUnread = true;
                if (msg.isHasAttachments()) hasAttachments = true;
            }

            conversation.setParticipants(new ArrayList<>(participantSet));
            conversation.setHasUnread(hasUnread);
            conversation.setHasAttachments(hasAttachments);
            conversation.setPreview(allMessages.get(allMessages.size() - 1).getPreview());

            // Set full message details (including body content)
            conversation.setMessages(allMessages);

            System.out.println("✅ Conversation thread loaded with " + allMessages.size() + " messages including body content");

            return conversation;

        } catch (MessagingException e) {
            throw new RuntimeException("Failed to fetch conversation: " + e.getMessage(), e);
        }
    }

    /**
     * Perform actions on emails (mark as read, delete, etc.)
     */
    public void performEmailActions(String email, EmailActionRequest request) {
        try {
            // Handle label actions separately as they work with database, not IMAP
            if (request.getAction() == EmailActionRequest.EmailAction.APPLY_LABEL ||
                request.getAction() == EmailActionRequest.EmailAction.REMOVE_LABEL) {

                if (request.getLabelId() == null) {
                    throw new IllegalArgumentException("Label ID is required for label actions");
                }
                if (request.getFolder() == null || request.getFolder().trim().isEmpty()) {
                    throw new IllegalArgumentException("Folder is required for label actions");
                }

                for (String messageUid : request.getMessageIds()) {
                    if (request.getAction() == EmailActionRequest.EmailAction.APPLY_LABEL) {
                        labelService.applyLabelToMessage(email, messageUid, request.getFolder(), request.getLabelId());
                    } else {
                        labelService.removeLabelFromMessage(email, messageUid, request.getFolder(), request.getLabelId());
                    }
                }
                return;
            }

            // Handle traditional IMAP actions (read/unread, delete, archive)
            Store store = getUserStore(email);
            if (store == null || !store.isConnected()) {
                throw new RuntimeException("User not authenticated or connection lost");
            }

            // Use specific folder from request, or search all folders if not specified
            List<String> foldersToSearch;
            if (request.getFolder() != null && !request.getFolder().trim().isEmpty()) {
                foldersToSearch = Arrays.asList(request.getFolder());
            } else {
                foldersToSearch = Arrays.asList("INBOX", "SENT", "DRAFTS", "TRASH", "STARRED", "IMPORTANT", "SPAM");
            }

            int processedCount = 0;
            for (String folderName : foldersToSearch) {
                Folder folder = getFolderByName(store, folderName);
                if (folder != null && folder.exists()) {
                    folder.open(Folder.READ_WRITE);

                    Message[] messages = folder.getMessages();
                    for (Message message : messages) {
                        // Convert to DTO to get threadId (frontend sends threadIds, not Message-IDs)
                        EmailHeaderDTO headerDTO = convertToEmailHeaderDTOWithThreading(message);
                        if (headerDTO != null && request.getMessageIds().contains(headerDTO.getThreadId())) {
                            performAction(message, request.getAction());
                            processedCount++;
                            System.out.println("Performed action " + request.getAction() + " on thread: " + headerDTO.getThreadId() + " in folder: " + folderName);
                        }
                    }

                    // Important: Expunge changes to actually delete messages
                    folder.close(true);
                    System.out.println("Processed " + processedCount + " messages in folder: " + folderName);
                }
            }

            System.out.println("✅ Total messages processed: " + processedCount + " out of " + request.getMessageIds().size() + " requested");

        } catch (MessagingException e) {
            throw new RuntimeException("Failed to perform email actions: " + e.getMessage(), e);
        }
    }

    /**
     * Group emails into conversations based on subject and threading headers
     */
    private List<ConversationDTO> groupIntoConversations(List<EmailHeaderDTO> emails) {
        Map<String, List<EmailHeaderDTO>> threadMap = new HashMap<>();

        for (EmailHeaderDTO email : emails) {
            String threadId = generateThreadId(email);
            email.setThreadId(threadId);
            threadMap.computeIfAbsent(threadId, k -> new ArrayList<>()).add(email);
        }

        List<ConversationDTO> conversations = new ArrayList<>();
        for (Map.Entry<String, List<EmailHeaderDTO>> entry : threadMap.entrySet()) {
            List<EmailHeaderDTO> threadMessages = entry.getValue();
            threadMessages.sort((a, b) -> a.getDate().compareTo(b.getDate()));

            ConversationDTO conversation = new ConversationDTO();
            conversation.setThreadId(entry.getKey());
            conversation.setSubject(threadMessages.get(0).getSubject());
            conversation.setMessageCount(threadMessages.size());
            conversation.setLastMessageDate(threadMessages.get(threadMessages.size() - 1).getDate());
            // Don't include full messages in conversation list - only for individual thread requests

            // Extract participants
            Set<String> participantSet = new HashSet<>();
            boolean hasUnread = false;
            boolean hasAttachments = false;

            for (EmailHeaderDTO msg : threadMessages) {
                participantSet.add(extractEmailAddress(msg.getFrom()));
                if (msg.isUnread()) hasUnread = true;
                if (msg.isHasAttachments()) hasAttachments = true;
            }

            conversation.setParticipants(new ArrayList<>(participantSet));
            conversation.setHasUnread(hasUnread);
            conversation.setHasAttachments(hasAttachments);
            conversation.setPreview(threadMessages.get(threadMessages.size() - 1).getPreview());

            conversations.add(conversation);
        }

        return conversations;
    }

    /**
     * Generate thread ID based on subject and references
     */
    private String generateThreadId(EmailHeaderDTO email) {
        // First, try to use references or in-reply-to to link to existing thread
        if (email.getInReplyTo() != null && !email.getInReplyTo().trim().isEmpty()) {
            try {
                return hashString(email.getInReplyTo().trim());
            } catch (Exception e) {
                // Fall back to message ID based threading
            }
        }

        if (email.getReferences() != null && !email.getReferences().trim().isEmpty()) {
            try {
                String[] refs = email.getReferences().split("\\s+");
                if (refs.length > 0) {
                    return hashString(refs[0].trim());
                }
            } catch (Exception e) {
                // Fall back to message ID based threading
            }
        }

        // For standalone emails (not replies), use the Message-ID as thread ID
        // This prevents grouping unrelated emails with similar subjects
        if (email.getMessageId() != null && !email.getMessageId().trim().isEmpty()) {
            return hashString(email.getMessageId().trim());
        }

        // Only fall back to subject-based threading as last resort
        String normalizedSubject = normalizeSubject(email.getSubject());
        return hashString(normalizedSubject + "_" + (email.getMessageId() != null ? email.getMessageId() : ""));
    }

    /**
     * Normalize email subject for threading
     */
    private String normalizeSubject(String subject) {
        if (subject == null || subject.trim().isEmpty()) {
            return "(no subject)";
        }

        // Remove common reply prefixes and normalize
        return subject.replaceAll("(?i)^(re:|fwd?:|fw:)\\s*", "").trim().toLowerCase();
    }

    /**
     * Hash string to create consistent thread IDs
     */
    private String hashString(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString().substring(0, 16); // Use first 16 chars
        } catch (Exception e) {
            return "thread-" + Math.abs(input.hashCode());
        }
    }

    /**
     * Extract email address from formatted string
     */
    private String extractEmailAddress(String addressString) {
        if (addressString == null || addressString.trim().isEmpty()) {
            return "unknown@example.com";
        }

        // Extract email from formats like "Name <email@domain.com>" or just "email@domain.com"
        if (addressString.contains("<") && addressString.contains(">")) {
            int start = addressString.indexOf('<') + 1;
            int end = addressString.indexOf('>', start);
            if (end > start) {
                return addressString.substring(start, end).trim();
            }
        }

        return addressString.trim();
    }

    /**
     * Enhanced email header conversion with threading information
     */
    private EmailHeaderDTO convertToEmailHeaderDTOWithThreading(Message message) {
        try {
            EmailHeaderDTO dto = convertToEmailHeaderDTO(message);
            if (dto != null) {
                // Add threading headers
                String[] inReplyTo = message.getHeader("In-Reply-To");
                if (inReplyTo != null && inReplyTo.length > 0) {
                    dto.setInReplyTo(inReplyTo[0]);
                }

                String[] references = message.getHeader("References");
                if (references != null && references.length > 0) {
                    dto.setReferences(references[0]);
                }

                // Calculate and set thread ID
                String threadId = generateThreadId(dto);
                dto.setThreadId(threadId);
            }
            return dto;
        } catch (MessagingException e) {
            System.err.println("Error converting message to DTO with threading: " + e.getMessage());
            return null;
        }
    }

    /**
     * Convert message to detailed DTO with full content
     */
    private EmailDetailDTO convertToEmailDetailDTO(Message message) {
        try {
            EmailDetailDTO dto = new EmailDetailDTO();

            // Copy basic information
            EmailHeaderDTO header = convertToEmailHeaderDTOWithThreading(message);
            if (header != null) {
                dto.setMessageId(header.getMessageId());
                dto.setFrom(header.getFrom());
                dto.setSubject(header.getSubject());
                dto.setDate(header.getDate());
                dto.setUnread(header.isUnread());
                dto.setHasAttachments(header.isHasAttachments());
                dto.setPreview(header.getPreview());
                dto.setThreadId(header.getThreadId());
                dto.setInReplyTo(header.getInReplyTo());
                dto.setReferences(header.getReferences());
            }

            // Add detailed information
            Address[] toAddresses = message.getRecipients(Message.RecipientType.TO);
            if (toAddresses != null) {
                dto.setTo(String.join(", ", Arrays.stream(toAddresses)
                    .map(Address::toString)
                    .toArray(String[]::new)));
            }

            Address[] ccAddresses = message.getRecipients(Message.RecipientType.CC);
            if (ccAddresses != null) {
                dto.setCc(String.join(", ", Arrays.stream(ccAddresses)
                    .map(Address::toString)
                    .toArray(String[]::new)));
            }

            Address[] bccAddresses = message.getRecipients(Message.RecipientType.BCC);
            if (bccAddresses != null) {
                dto.setBcc(String.join(", ", Arrays.stream(bccAddresses)
                    .map(Address::toString)
                    .toArray(String[]::new)));
            }

            // Get full content
            String textContent = getTextContent(message);
            dto.setTextContent(textContent);
            System.out.println("Set textContent for " + dto.getMessageId() + " length: " + (textContent != null ? textContent.length() : 0));

            // For HTML content, try to get it if available
            if (message.isMimeType("text/html")) {
                String htmlContent = (String) message.getContent();
                dto.setHtmlContent(htmlContent);
                System.out.println("Set HTML content directly, length: " + (htmlContent != null ? htmlContent.length() : 0));
            } else if (message.isMimeType("multipart/*")) {
                String htmlFromMultipart = getHtmlFromMultipart((Multipart) message.getContent());
                dto.setHtmlContent(htmlFromMultipart);
                System.out.println("Set HTML content from multipart, length: " + (htmlFromMultipart != null ? htmlFromMultipart.length() : 0));
            }

            // If no HTML content, use text content
            if (dto.getHtmlContent() == null || dto.getHtmlContent().trim().isEmpty()) {
                String fallbackHtml = "<pre>" + (textContent != null ? textContent : "") + "</pre>";
                dto.setHtmlContent(fallbackHtml);
                System.out.println("Using fallback HTML content, length: " + fallbackHtml.length());
            }

            System.out.println("Final DTO content - Text length: " + (dto.getTextContent() != null ? dto.getTextContent().length() : 0) +
                             ", HTML length: " + (dto.getHtmlContent() != null ? dto.getHtmlContent().length() : 0));

            return dto;

        } catch (Exception e) {
            System.err.println("Error converting message to detailed DTO: " + e.getMessage());
            return null;
        }
    }

    /**
     * Get HTML content from multipart message
     */
    private String getHtmlFromMultipart(Multipart multipart) {
        try {
            System.out.println("Processing multipart for HTML with " + multipart.getCount() + " parts");

            for (int i = 0; i < multipart.getCount(); i++) {
                BodyPart bodyPart = multipart.getBodyPart(i);
                String contentType = bodyPart.getContentType();
                System.out.println("HTML search - Part " + i + " content type: " + contentType);

                if (bodyPart.isMimeType("text/html")) {
                    String content = bodyPart.getContent().toString();
                    System.out.println("Found HTML part with length: " + content.length());
                    return content;
                } else if (bodyPart.isMimeType("multipart/*")) {
                    // Handle nested multipart
                    System.out.println("Found nested multipart for HTML, recursing...");
                    Multipart nestedMultipart = (Multipart) bodyPart.getContent();
                    String nestedHtml = getHtmlFromMultipart(nestedMultipart);
                    if (nestedHtml != null && !nestedHtml.trim().isEmpty()) {
                        return nestedHtml;
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("ERROR in getHtmlFromMultipart: " + e.getMessage());
            e.printStackTrace();
        }
        return "";
    }

    /**
     * Get message ID from message
     */
    private String getMessageId(Message message) {
        try {
            String[] messageIds = message.getHeader("Message-ID");
            if (messageIds != null && messageIds.length > 0) {
                return messageIds[0];
            } else {
                return "msg-" + message.getMessageNumber() + "-" + System.currentTimeMillis();
            }
        } catch (MessagingException e) {
            return "msg-" + System.currentTimeMillis();
        }
    }

    /**
     * Perform specific action on message
     */
    private void performAction(Message message, EmailActionRequest.EmailAction action) {
        try {
            switch (action) {
                case MARK_AS_READ:
                    message.setFlag(Flags.Flag.SEEN, true);
                    break;
                case MARK_AS_UNREAD:
                    message.setFlag(Flags.Flag.SEEN, false);
                    break;
                case DELETE:
                    moveMessageToTrash(message);
                    break;
                case ARCHIVE:
                    // For now, just mark as archived (could move to Archive folder in future)
                    message.setFlag(Flags.Flag.USER, true);
                    break;
                case STAR:
                    copyMessageToFolder(message, "STARRED");
                    message.setFlag(Flags.Flag.FLAGGED, true); // Also set IMAP FLAGGED flag
                    break;
                case UNSTAR:
                    removeMessageFromFolder(message, "STARRED");
                    message.setFlag(Flags.Flag.FLAGGED, false);
                    break;
                case MARK_IMPORTANT:
                    copyMessageToFolder(message, "IMPORTANT");
                    break;
                case UNMARK_IMPORTANT:
                    removeMessageFromFolder(message, "IMPORTANT");
                    break;
                case MOVE_TO_SPAM:
                    moveMessageToFolder(message, "SPAM");
                    break;
                default:
                    break;
            }
        } catch (MessagingException e) {
            System.err.println("Error performing action on message: " + e.getMessage());
        }
    }

    /**
     * Copy message to a specific folder (for starring, marking important, etc.)
     */
    private void copyMessageToFolder(Message message, String targetFolderName) throws MessagingException {
        try {
            Store store = message.getFolder().getStore();
            Folder targetFolder = getFolderByName(store, targetFolderName);

            if (targetFolder == null) {
                System.err.println("Target folder " + targetFolderName + " not found");
                return;
            }

            // Open target folder for writing
            if (!targetFolder.isOpen()) {
                targetFolder.open(Folder.READ_WRITE);
            }

            // Copy message to target folder
            Message[] messagesToCopy = {message};
            message.getFolder().copyMessages(messagesToCopy, targetFolder);

            System.out.println("Message copied to " + targetFolderName + " folder successfully");

        } catch (MessagingException e) {
            System.err.println("Error copying message to " + targetFolderName + ": " + e.getMessage());
            throw e;
        }
    }

    /**
     * Move message to a specific folder (for spam, etc.)
     */
    private void moveMessageToFolder(Message message, String targetFolderName) throws MessagingException {
        try {
            Store store = message.getFolder().getStore();
            Folder targetFolder = getFolderByName(store, targetFolderName);

            if (targetFolder == null) {
                System.err.println("Target folder " + targetFolderName + " not found");
                return;
            }

            // Open target folder for writing
            if (!targetFolder.isOpen()) {
                targetFolder.open(Folder.READ_WRITE);
            }

            // Copy message to target folder
            Message[] messagesToCopy = {message};
            message.getFolder().copyMessages(messagesToCopy, targetFolder);

            // Mark original message as deleted (this will remove it from source folder when expunged)
            message.setFlag(Flags.Flag.DELETED, true);

            System.out.println("Message moved to " + targetFolderName + " folder successfully");

        } catch (MessagingException e) {
            System.err.println("Error moving message to " + targetFolderName + ": " + e.getMessage());
            throw e;
        }
    }

    /**
     * Remove message from a specific folder (for unstarring, unmarking important, etc.)
     */
    private void removeMessageFromFolder(Message message, String sourceFolderName) throws MessagingException {
        try {
            Store store = message.getFolder().getStore();
            Folder sourceFolder = getFolderByName(store, sourceFolderName);

            if (sourceFolder == null || !sourceFolder.exists()) {
                System.err.println("Source folder " + sourceFolderName + " not found");
                return;
            }

            // Get message ID to find in target folder
            String messageId = getMessageId(message);

            sourceFolder.open(Folder.READ_WRITE);
            Message[] messages = sourceFolder.getMessages();

            // Find and delete the message in the source folder
            for (Message msg : messages) {
                if (getMessageId(msg).equals(messageId)) {
                    msg.setFlag(Flags.Flag.DELETED, true);
                    System.out.println("Message removed from " + sourceFolderName + " folder");
                    break;
                }
            }

            sourceFolder.close(true); // Expunge

        } catch (MessagingException e) {
            System.err.println("Error removing message from " + sourceFolderName + ": " + e.getMessage());
        }
    }

    /**
     * Move message to trash folder instead of just marking as deleted
     */
    private void moveMessageToTrash(Message message) throws MessagingException {
        try {
            Store store = message.getFolder().getStore();
            Folder trashFolder = getFolderByName(store, "TRASH");

            if (trashFolder == null) {
                // If no trash folder exists, fall back to marking as deleted
                System.err.println("No TRASH folder found, marking message as deleted");
                message.setFlag(Flags.Flag.DELETED, true);
                return;
            }

            // Open trash folder for writing
            if (!trashFolder.isOpen()) {
                trashFolder.open(Folder.READ_WRITE);
            }

            // Copy message to trash folder
            Message[] messagesToCopy = {message};
            message.getFolder().copyMessages(messagesToCopy, trashFolder);

            // Mark original message as deleted (this will remove it from source folder when expunged)
            message.setFlag(Flags.Flag.DELETED, true);

            System.out.println("Message moved to TRASH folder successfully");

        } catch (MessagingException e) {
            System.err.println("Error moving message to trash: " + e.getMessage());
            // Fall back to just marking as deleted
            message.setFlag(Flags.Flag.DELETED, true);
        }
    }

    /**
     * Save email as draft in DRAFTS folder
     */
    public String saveDraft(String userEmail, SendEmailRequestDTO draftRequest) throws MessagingException {
        System.out.println("=== SAVING DRAFT ===");
        System.out.println("User: " + userEmail);
        System.out.println("To: " + draftRequest.getTo());
        System.out.println("Subject: " + draftRequest.getSubject());

        Store store = getUserStore(userEmail);
        if (store == null || !store.isConnected()) {
            throw new RuntimeException("User not authenticated or connection lost");
        }

        try {
            // Get DRAFTS folder (it will be auto-created if it doesn't exist)
            Folder draftsFolder = getFolderByName(store, "DRAFTS");
            if (draftsFolder == null) {
                throw new RuntimeException("Unable to access DRAFTS folder");
            }

            // Open the DRAFTS folder for writing
            if (!draftsFolder.isOpen()) {
                draftsFolder.open(Folder.READ_WRITE);
            }

            // Create the draft message
            Properties props = new Properties();
            Session session = Session.getDefaultInstance(props);
            MimeMessage draftMessage = new MimeMessage(session);

            // Set headers
            draftMessage.setFrom(new InternetAddress(userEmail));

            // Set recipients
            if (draftRequest.getTo() != null && !draftRequest.getTo().trim().isEmpty()) {
                draftMessage.setRecipients(Message.RecipientType.TO, InternetAddress.parse(draftRequest.getTo()));
            }
            if (draftRequest.getCc() != null && !draftRequest.getCc().trim().isEmpty()) {
                draftMessage.setRecipients(Message.RecipientType.CC, InternetAddress.parse(draftRequest.getCc()));
            }
            if (draftRequest.getBcc() != null && !draftRequest.getBcc().trim().isEmpty()) {
                draftMessage.setRecipients(Message.RecipientType.BCC, InternetAddress.parse(draftRequest.getBcc()));
            }

            // Set subject
            draftMessage.setSubject(draftRequest.getSubject() != null ? draftRequest.getSubject() : "");

            // Set content
            if (draftRequest.getAttachments() != null && !draftRequest.getAttachments().isEmpty()) {
                // Create multipart message with attachments
                Multipart multipart = new MimeMultipart();

                // Add text content
                MimeBodyPart textPart = new MimeBodyPart();
                textPart.setContent(draftRequest.getHtmlContent() != null ? draftRequest.getHtmlContent() : "", "text/html; charset=utf-8");
                multipart.addBodyPart(textPart);

                // Add attachments
                for (FileAttachmentDTO attachment : draftRequest.getAttachments()) {
                    MimeBodyPart attachmentPart = new MimeBodyPart();
                    DataSource source = new ByteArrayDataSource(attachment.getContent(), attachment.getContentType());
                    attachmentPart.setDataHandler(new DataHandler(source));
                    attachmentPart.setFileName(attachment.getFileName());
                    multipart.addBodyPart(attachmentPart);
                }

                draftMessage.setContent(multipart);
            } else {
                // Simple text message
                draftMessage.setContent(draftRequest.getHtmlContent() != null ? draftRequest.getHtmlContent() : "", "text/html; charset=utf-8");
            }

            // Set date
            draftMessage.setSentDate(new Date());

            // Mark as draft
            draftMessage.setFlag(Flags.Flag.DRAFT, true);

            // Save to DRAFTS folder
            draftsFolder.appendMessages(new Message[]{draftMessage});

            // Get the message ID of the saved draft
            String messageId = draftMessage.getMessageID();

            // Close the folder
            draftsFolder.close(false);

            System.out.println("=== DRAFT SAVED SUCCESSFULLY ===");
            System.out.println("Draft Message-ID: " + messageId);

            return messageId;

        } catch (Exception e) {
            System.err.println("Failed to save draft: " + e.getMessage());
            throw new MessagingException("Failed to save draft: " + e.getMessage(), e);
        }
    }

    /**
     * Search emails using IMAP SearchTerm
     * Supports queries like: from:user@example.com subject:report
     */
    public EmailListResponse searchEmails(String email, String query, String folderName, int page, int size) {
        try {
            Store store = getUserStore(email);
            if (store == null || !store.isConnected()) {
                throw new RuntimeException("User not authenticated or connection lost");
            }

            Folder folder = getFolderByName(store, folderName != null ? folderName : "INBOX");
            if (folder == null) {
                throw new RuntimeException("Folder '" + (folderName != null ? folderName : "INBOX") + "' not found");
            }

            folder.open(Folder.READ_ONLY);

            // Parse the search query and build SearchTerm
            SearchTerm searchTerm = parseSearchQuery(query);

            Message[] messages = folder.search(searchTerm);

            // Sort messages by date (newest first)
            Arrays.sort(messages, (m1, m2) -> {
                try {
                    Date d1 = m1.getSentDate();
                    Date d2 = m2.getSentDate();
                    if (d1 == null && d2 == null) return 0;
                    if (d1 == null) return 1;
                    if (d2 == null) return -1;
                    return d2.compareTo(d1);
                } catch (MessagingException e) {
                    return 0;
                }
            });

            int totalResults = messages.length;

            // Apply pagination
            int startIndex = page * size;
            int endIndex = Math.min(startIndex + size, totalResults);

            List<EmailHeaderDTO> emailHeaders = new ArrayList<>();

            if (startIndex < totalResults) {
                Message[] pageMessages = Arrays.copyOfRange(messages, startIndex, endIndex);

                emailHeaders = Arrays.stream(pageMessages)
                    .map(this::convertToEmailHeaderDTO)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            }

            folder.close(false);

            return new EmailListResponse(emailHeaders, totalResults, page, size);

        } catch (MessagingException e) {
            throw new RuntimeException("Failed to search emails: " + e.getMessage(), e);
        }
    }

    /**
     * Parse search query string into IMAP SearchTerm
     * Supports: from:email, to:email, subject:text, body:text
     */
    private SearchTerm parseSearchQuery(String query) {
        if (query == null || query.trim().isEmpty()) {
            // Return a search term that matches all messages
            return new BodyTerm("");
        }

        List<SearchTerm> terms = new ArrayList<>();

        // Split query by spaces, but preserve quoted strings
        String[] parts = query.split("\\s+");

        for (String part : parts) {
            if (part.contains(":")) {
                String[] keyValue = part.split(":", 2);
                if (keyValue.length == 2) {
                    String key = keyValue[0].toLowerCase();
                    String value = keyValue[1];

                    // Remove quotes if present
                    if (value.startsWith("\"") && value.endsWith("\"") && value.length() > 1) {
                        value = value.substring(1, value.length() - 1);
                    }

                    SearchTerm term = null;
                    switch (key) {
                        case "from":
                            term = new FromStringTerm(value);
                            break;
                        case "to":
                            term = new RecipientStringTerm(Message.RecipientType.TO, value);
                            break;
                        case "subject":
                            term = new SubjectTerm(value);
                            break;
                        case "body":
                            term = new BodyTerm(value);
                            break;
                    }

                    if (term != null) {
                        terms.add(term);
                    }
                }
            } else {
                // If no prefix, search in subject and body
                terms.add(new OrTerm(
                    new SubjectTerm(part),
                    new BodyTerm(part)
                ));
            }
        }

        if (terms.isEmpty()) {
            return new BodyTerm("");
        } else if (terms.size() == 1) {
            return terms.get(0);
        } else {
            // Combine all terms with AND
            SearchTerm result = terms.get(0);
            for (int i = 1; i < terms.size(); i++) {
                result = new AndTerm(result, terms.get(i));
            }
            return result;
        }
    }

    /**
     * Get draft email details for editing
     */
    public DraftEmailDTO getDraft(String userEmail, String messageId) {
        try {
            Store store = getUserStore(userEmail);
            if (store == null || !store.isConnected()) {
                throw new RuntimeException("User not authenticated or connection lost");
            }

            Folder draftsFolder = getFolderByName(store, "DRAFTS");
            if (draftsFolder == null) {
                throw new RuntimeException("DRAFTS folder not found and could not be created");
            }
            draftsFolder.open(Folder.READ_ONLY);

            // Search for the draft by message ID
            SearchTerm term = new MessageIDTerm(messageId);
            Message[] messages = draftsFolder.search(term);

            if (messages.length == 0) {
                throw new RuntimeException("Draft not found with ID: " + messageId);
            }

            Message message = messages[0];
            DraftEmailDTO draft = new DraftEmailDTO();

            // Set basic properties
            draft.setMessageId(messageId);
            draft.setSubject(message.getSubject());

            // Extract recipients
            if (message.getRecipients(Message.RecipientType.TO) != null) {
                List<String> toList = Arrays.stream(message.getRecipients(Message.RecipientType.TO))
                    .map(address -> address.toString())
                    .collect(Collectors.toList());
                draft.setTo(toList);
            }

            if (message.getRecipients(Message.RecipientType.CC) != null) {
                List<String> ccList = Arrays.stream(message.getRecipients(Message.RecipientType.CC))
                    .map(address -> address.toString())
                    .collect(Collectors.toList());
                draft.setCc(ccList);
            }

            if (message.getRecipients(Message.RecipientType.BCC) != null) {
                List<String> bccList = Arrays.stream(message.getRecipients(Message.RecipientType.BCC))
                    .map(address -> address.toString())
                    .collect(Collectors.toList());
                draft.setBcc(bccList);
            }

            // Extract full content (not preview) for editing
            String content = extractFullContent(message);
            if (message.isMimeType("text/html") || content.contains("<")) {
                draft.setHtmlContent(content);
            } else {
                draft.setTextContent(content);
            }

            // Set timestamps
            if (message.getSentDate() != null) {
                draft.setCreated(LocalDateTime.ofInstant(message.getSentDate().toInstant(), ZoneId.systemDefault()));
            }
            if (message.getReceivedDate() != null) {
                draft.setLastModified(LocalDateTime.ofInstant(message.getReceivedDate().toInstant(), ZoneId.systemDefault()));
            }

            // Set empty attachments for now (can be enhanced later)
            draft.setAttachments(new ArrayList<>());

            draftsFolder.close(false);

            return draft;

        } catch (Exception e) {
            throw new RuntimeException("Failed to get draft: " + e.getMessage(), e);
        }
    }

    /**
     * Update existing draft
     */
    public void updateDraft(String userEmail, String messageId, DraftEmailDTO draftData) {
        try {
            System.out.println("=== UPDATING DRAFT ===");
            System.out.println("User: " + userEmail);
            System.out.println("Draft ID to update: " + messageId);

            Store store = getUserStore(userEmail);
            if (store == null || !store.isConnected()) {
                throw new RuntimeException("User not authenticated or connection lost");
            }

            Folder draftsFolder = getFolderByName(store, "DRAFTS");
            if (draftsFolder == null) {
                throw new RuntimeException("DRAFTS folder not found and could not be created");
            }
            draftsFolder.open(Folder.READ_WRITE);

            // STEP 1: Find and delete the old draft
            SearchTerm term = new MessageIDTerm(messageId);
            Message[] existingDrafts = draftsFolder.search(term);

            if (existingDrafts.length > 0) {
                System.out.println("Found existing draft, marking for deletion");
                for (Message oldDraft : existingDrafts) {
                    oldDraft.setFlag(Flags.Flag.DELETED, true);
                }
            } else {
                System.out.println("WARNING: Draft with ID " + messageId + " not found, creating new one");
            }

            // STEP 2: Create new draft message with updated content
            Properties props = new Properties();
            Session session = Session.getDefaultInstance(props);
            MimeMessage message = new MimeMessage(session);

            // Set recipients
            if (draftData.getTo() != null && !draftData.getTo().isEmpty()) {
                InternetAddress[] toAddresses = draftData.getTo().stream()
                    .map(email -> {
                        try {
                            return new InternetAddress(email);
                        } catch (Exception e) {
                            throw new RuntimeException("Invalid email address: " + email);
                        }
                    })
                    .toArray(InternetAddress[]::new);
                message.setRecipients(Message.RecipientType.TO, toAddresses);
            }

            if (draftData.getCc() != null && !draftData.getCc().isEmpty()) {
                InternetAddress[] ccAddresses = draftData.getCc().stream()
                    .map(email -> {
                        try {
                            return new InternetAddress(email);
                        } catch (Exception e) {
                            throw new RuntimeException("Invalid email address: " + email);
                        }
                    })
                    .toArray(InternetAddress[]::new);
                message.setRecipients(Message.RecipientType.CC, ccAddresses);
            }

            if (draftData.getBcc() != null && !draftData.getBcc().isEmpty()) {
                InternetAddress[] bccAddresses = draftData.getBcc().stream()
                    .map(email -> {
                        try {
                            return new InternetAddress(email);
                        } catch (Exception e) {
                            throw new RuntimeException("Invalid email address: " + email);
                        }
                    })
                    .toArray(InternetAddress[]::new);
                message.setRecipients(Message.RecipientType.BCC, bccAddresses);
            }

            // Set subject and content
            message.setSubject(draftData.getSubject());
            message.setFrom(new InternetAddress(userEmail));

            String content = draftData.getHtmlContent() != null ? draftData.getHtmlContent() : draftData.getTextContent();
            if (draftData.getHtmlContent() != null) {
                message.setContent(content, "text/html; charset=utf-8");
            } else {
                message.setText(content);
            }

            message.setSentDate(new Date());
            message.setFlag(Flags.Flag.DRAFT, true);

            // STEP 3: Save new draft to folder
            draftsFolder.appendMessages(new Message[]{message});

            // STEP 4: Expunge to permanently remove old draft(s)
            draftsFolder.close(true); // true = expunge deleted messages

            System.out.println("=== DRAFT UPDATED SUCCESSFULLY ===");

        } catch (Exception e) {
            throw new RuntimeException("Failed to update draft: " + e.getMessage(), e);
        }
    }

    /**
     * Save reply as draft
     */
    public void saveReplyDraft(String userEmail, ReplyRequestDTO request) {
        try {
            Store store = getUserStore(userEmail);
            if (store == null || !store.isConnected()) {
                throw new RuntimeException("User not authenticated or connection lost");
            }

            Folder draftsFolder = getFolderByName(store, "DRAFTS");
            if (draftsFolder == null) {
                throw new RuntimeException("DRAFTS folder not found and could not be created");
            }
            draftsFolder.open(Folder.READ_WRITE);

            MimeMessage message = javaMailSender.createMimeMessage();

            // Set recipients
            if (request.getTo() != null && !request.getTo().isEmpty()) {
                InternetAddress[] toAddresses = request.getTo().stream()
                    .map(email -> {
                        try {
                            return new InternetAddress(email);
                        } catch (Exception e) {
                            throw new RuntimeException("Invalid email address: " + email);
                        }
                    })
                    .toArray(InternetAddress[]::new);
                message.setRecipients(Message.RecipientType.TO, toAddresses);
            }

            if (request.getCc() != null && !request.getCc().isEmpty()) {
                InternetAddress[] ccAddresses = request.getCc().stream()
                    .map(email -> {
                        try {
                            return new InternetAddress(email);
                        } catch (Exception e) {
                            throw new RuntimeException("Invalid email address: " + email);
                        }
                    })
                    .toArray(InternetAddress[]::new);
                message.setRecipients(Message.RecipientType.CC, ccAddresses);
            }

            if (request.getBcc() != null && !request.getBcc().isEmpty()) {
                InternetAddress[] bccAddresses = request.getBcc().stream()
                    .map(email -> {
                        try {
                            return new InternetAddress(email);
                        } catch (Exception e) {
                            throw new RuntimeException("Invalid email address: " + email);
                        }
                    })
                    .toArray(InternetAddress[]::new);
                message.setRecipients(Message.RecipientType.BCC, bccAddresses);
            }

            // Set subject and content
            message.setSubject(request.getSubject());
            message.setFrom(new InternetAddress(userEmail));
            message.setContent(request.getBody(), "text/html; charset=utf-8");
            message.setSentDate(new Date());

            // Add headers for reply tracking
            if (request.getReplyToMessageId() != null) {
                message.setHeader("In-Reply-To", request.getReplyToMessageId());
                message.setHeader("References", request.getReplyToMessageId());
            }

            // Save to drafts folder
            draftsFolder.appendMessages(new Message[]{message});

            draftsFolder.close(false);
            store.close();

        } catch (Exception e) {
            throw new RuntimeException("Failed to save reply draft: " + e.getMessage(), e);
        }
    }

    /**
     * Delete draft by message ID
     */
    public void deleteDraft(String userEmail, String messageId) {
        try {
            Store store = getUserStore(userEmail);
            if (store == null || !store.isConnected()) {
                throw new RuntimeException("User not authenticated or connection lost");
            }

            Folder draftsFolder = getFolderByName(store, "DRAFTS");
            if (draftsFolder == null) {
                throw new RuntimeException("DRAFTS folder not found and could not be created");
            }
            draftsFolder.open(Folder.READ_WRITE);

            // Search for the draft by message ID
            SearchTerm term = new MessageIDTerm(messageId);
            Message[] messages = draftsFolder.search(term);

            if (messages.length == 0) {
                System.out.println("Draft not found with ID: " + messageId);
                draftsFolder.close(false);
                return; // Don't throw error if draft not found
            }

            // Delete the message
            messages[0].setFlag(Flags.Flag.DELETED, true);
            draftsFolder.expunge(); // Permanently remove deleted messages

            draftsFolder.close(false);

        } catch (Exception e) {
            throw new RuntimeException("Failed to delete draft: " + e.getMessage(), e);
        }
    }

    /**
     * Bulk delete drafts - more efficient than deleting one by one
     */
    public void bulkDeleteDrafts(String userEmail, List<String> messageIds) {
        try {
            Store store = getUserStore(userEmail);
            if (store == null || !store.isConnected()) {
                throw new RuntimeException("User not authenticated or connection lost");
            }

            Folder draftsFolder = getFolderByName(store, "DRAFTS");
            if (draftsFolder == null) {
                throw new RuntimeException("DRAFTS folder not found and could not be created");
            }
            draftsFolder.open(Folder.READ_WRITE);

            int deletedCount = 0;
            // Get all messages in drafts folder
            Message[] allMessages = draftsFolder.getMessages();

            System.out.println("=== BULK DELETE DRAFTS ===");
            System.out.println("Total messages in DRAFTS folder: " + allMessages.length);
            System.out.println("Message IDs to delete: " + messageIds);

            // Mark matching messages for deletion
            for (Message message : allMessages) {
                try {
                    String[] msgIdHeaders = message.getHeader("Message-ID");
                    if (msgIdHeaders == null || msgIdHeaders.length == 0) {
                        System.out.println("Message has no Message-ID header, skipping");
                        continue;
                    }

                    String msgId = msgIdHeaders[0];
                    String cleanMsgId = msgId.replaceAll("[<>]", "").trim();

                    System.out.println("Checking message ID: " + cleanMsgId);

                    // Check both original and cleaned versions
                    if (messageIds.contains(msgId) || messageIds.contains(cleanMsgId)) {
                        message.setFlag(Flags.Flag.DELETED, true);
                        deletedCount++;
                        System.out.println("Marked for deletion: " + cleanMsgId);
                    }
                } catch (Exception e) {
                    System.err.println("Error processing message: " + e.getMessage());
                }
            }

            // Expunge all deleted messages at once
            if (deletedCount > 0) {
                draftsFolder.expunge();
                System.out.println("Bulk deleted " + deletedCount + " drafts");
            }

            draftsFolder.close(false);

        } catch (Exception e) {
            throw new RuntimeException("Failed to bulk delete drafts: " + e.getMessage(), e);
        }
    }

    /**
     * Send reply or forward email
     */
    public void sendReply(String userEmail, ReplyRequestDTO request) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Set basic properties
            helper.setFrom(userEmail);
            helper.setSubject(request.getSubject());
            helper.setText(request.getBody(), true); // true for HTML

            // Set recipients
            if (request.getTo() != null && !request.getTo().isEmpty()) {
                helper.setTo(request.getTo().toArray(new String[0]));
            }

            if (request.getCc() != null && !request.getCc().isEmpty()) {
                helper.setCc(request.getCc().toArray(new String[0]));
            }

            if (request.getBcc() != null && !request.getBcc().isEmpty()) {
                helper.setBcc(request.getBcc().toArray(new String[0]));
            }

            // Add headers for reply tracking
            if (request.getReplyToMessageId() != null) {
                message.setHeader("In-Reply-To", request.getReplyToMessageId());
                message.setHeader("References", request.getReplyToMessageId());
            }

            // Add attachments if present
            if (request.getAttachments() != null) {
                for (FileAttachmentDTO attachment : request.getAttachments()) {
                    DataSource dataSource = new ByteArrayDataSource(attachment.getContent(), attachment.getContentType());
                    helper.addAttachment(attachment.getFileName(), dataSource);
                }
            }

            // Send the message
            javaMailSender.send(message);

            // Save to sent folder
            saveSentEmailSecure(userEmail, message);

        } catch (Exception e) {
            throw new RuntimeException("Failed to send reply: " + e.getMessage(), e);
        }
    }

    /**
     * Create user in Apache James mail server using WebAdmin API
     */
    public boolean createJamesUser(String email, String password) {
        try {
            System.out.println("=== CREATING JAMES USER VIA WEBADMIN API ===");
            System.out.println("Email: " + email);
            System.out.println("WebAdmin URL: http://" + jamesWebAdminHost + ":" + jamesWebAdminPort);

            String url = String.format("http://%s:%d/users/%s",
                jamesWebAdminHost, jamesWebAdminPort, email);

            // Use RestTemplate to make HTTP PUT request
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

            // Create request body with password
            java.util.Map<String, String> requestBody = new java.util.HashMap<>();
            requestBody.put("password", password);

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

            org.springframework.http.HttpEntity<java.util.Map<String, String>> request =
                new org.springframework.http.HttpEntity<>(requestBody, headers);

            org.springframework.http.ResponseEntity<String> response =
                restTemplate.exchange(url, org.springframework.http.HttpMethod.PUT, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("✅ User created successfully in James");
                return true;
            } else {
                System.err.println("Failed to create user. Status: " + response.getStatusCode());
                return false;
            }
        } catch (Exception e) {
            System.err.println("Failed to create James user: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Update user password in Apache James mail server using WebAdmin API
     */
    public boolean updateJamesUserPassword(String email, String newPassword) {
        try {
            System.out.println("=== UPDATING JAMES USER PASSWORD VIA WEBADMIN API ===");
            System.out.println("Email: " + email);

            String url = String.format("http://%s:%d/users/%s/password",
                jamesWebAdminHost, jamesWebAdminPort, email);

            // Use RestTemplate to make HTTP PUT request
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

            // Create request body with password
            java.util.Map<String, String> requestBody = new java.util.HashMap<>();
            requestBody.put("password", newPassword);

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);

            org.springframework.http.HttpEntity<java.util.Map<String, String>> request =
                new org.springframework.http.HttpEntity<>(requestBody, headers);

            org.springframework.http.ResponseEntity<String> response =
                restTemplate.exchange(url, org.springframework.http.HttpMethod.PUT, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("✅ User password updated successfully in James");
                return true;
            } else {
                System.err.println("Failed to update password. Status: " + response.getStatusCode());
                return false;
            }
        } catch (Exception e) {
            System.err.println("Failed to update James user password: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Delete user from Apache James mail server using WebAdmin API
     */
    public boolean deleteJamesUser(String email) {
        try {
            System.out.println("=== DELETING JAMES USER VIA WEBADMIN API ===");
            System.out.println("Email: " + email);

            String url = String.format("http://%s:%d/users/%s",
                jamesWebAdminHost, jamesWebAdminPort, email);

            // Use RestTemplate to make HTTP DELETE request
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

            org.springframework.http.ResponseEntity<String> response =
                restTemplate.exchange(url, org.springframework.http.HttpMethod.DELETE, null, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("✅ User deleted successfully from James");
                return true;
            } else {
                System.err.println("Failed to delete user. Status: " + response.getStatusCode());
                return false;
            }
        } catch (org.springframework.web.client.HttpClientErrorException.NotFound e) {
            // User doesn't exist, which is fine for deletion
            System.out.println("User not found in James (already deleted or never existed)");
            return true;
        } catch (Exception e) {
            System.err.println("Failed to delete James user: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

}