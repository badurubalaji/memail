# Comprehensive Development Plan - Memail Application

This document provides the complete development plan as requested, including architectural design, key code snippets, and best practices for building the Gmail-inspired webmail client.

## 📋 Table of Contents

1. [High-Level Architecture Diagram](#1-high-level-architecture-diagram)
2. [Backend Development Plan (Spring Boot 3.x)](#2-backend-development-plan-spring-boot-3x)
3. [Frontend Development Plan (Angular 20)](#3-frontend-development-plan-angular-20)
4. [Development Roadmap](#4-development-roadmap)

---

## 1. High-Level Architecture Diagram

```
                                    MEMAIL APPLICATION ARCHITECTURE

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENT LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                          Angular 20 SPA                                        │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌──────────┐  │    │
│  │  │   Login Page    │  │  Mail List View │  │ Conversation     │  │ Compose  │  │    │
│  │  │                 │  │                 │  │ Detail View     │  │ Editor   │  │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └──────────┘  │    │
│  │                                                                                │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │    │
│  │  │  Mail Service   │  │   Auth Service  │  │  WebSocket      │               │    │
│  │  │  (HTTP Client)  │  │  (JWT Storage)  │  │  Service        │               │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ HTTPS/WSS
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 APPLICATION LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                        Spring Boot 3.5.5 API Gateway                          │    │
│  │                                                                                 │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │    │
│  │  │  Auth Controller│  │ Email Controller│  │ Label Controller│               │    │
│  │  │  /api/auth/*    │  │ /api/emails/*   │  │ /api/labels/*   │               │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘               │    │
│  │                                                                                 │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │    │
│  │  │   Mail Service  │  │  Auth Service   │  │ Label Service   │               │    │
│  │  │ (IMAP Client)   │  │ (JWT Provider)  │  │                 │               │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘               │    │
│  │                                                                                 │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │    │
│  │  │ Conversation    │  │  WebSocket      │  │  Security       │               │    │
│  │  │ Threader        │  │  Handler        │  │  Filter         │               │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ IMAP/SMTP
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   EMAIL SERVER                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                           Apache James Email Server                            │    │
│  │                                                                                 │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │    │
│  │  │  IMAP Server    │  │  SMTP Server    │  │  User Store     │               │    │
│  │  │  Port: 143/993  │  │  Port: 25/587   │  │  (Authentication│               │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘               │    │
│  │                                                                                 │    │
│  │  ┌─────────────────┐  ┌─────────────────┐                                     │    │
│  │  │  Mailbox Store  │  │  Message Store  │                                     │    │
│  │  │  (Folders)      │  │  (Email Data)   │                                     │    │
│  │  └─────────────────┘  └─────────────────┘                                     │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ JPA/SQL
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PERSISTENCE LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                              PostgreSQL Database                               │    │
│  │                                                                                 │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │    │
│  │  │     Users       │  │  User Prefs     │  │    Labels       │               │    │
│  │  │   - id          │  │ - theme         │  │  - name         │               │    │
│  │  │   - email       │  │ - emails/page   │  │  - color        │               │    │
│  │  │   - password    │  │ - language      │  │  - user_id      │               │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘               │    │
│  │                                                                                 │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │    │
│  │  │ Email Metadata  │  │   Contacts      │  │  Email Labels   │               │    │
│  │  │ - message_id    │  │ - email         │  │ - email_meta_id │               │    │
│  │  │ - thread_id     │  │ - display_name  │  │ - label_id      │               │    │
│  │  │ - is_read       │  │ - last_contact  │  │ - applied_at    │               │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                    DATA FLOW DIAGRAM

    User Action → Angular Component → HTTP Request → Spring Controller → Service Layer
                                                           │
                                                           ▼
    PostgreSQL ← JPA Repository ← Business Logic ← IMAP Client ← Apache James
                                                           │
                                                           ▼
    WebSocket ← Notification Service ← Email Processing ← Email Events
```

---

## 2. Backend Development Plan (Spring Boot 3.x)

### 2.1 Project Setup

#### Complete pom.xml (Spring Boot 3.5.5)
Already created at `/backend/pom.xml` with all required dependencies:
- Spring Boot Web, Security, Data JPA
- PostgreSQL, Flyway
- Jakarta Mail API
- JWT dependencies
- WebSocket support
- Testing libraries

#### Folder Structure
```
src/main/java/com/memail/
├── MemailApplication.java
├── config/
│   ├── SecurityConfig.java
│   ├── WebSocketConfig.java
│   ├── MailConfig.java
│   └── CorsConfig.java
├── controller/
│   ├── AuthController.java
│   ├── EmailController.java
│   ├── LabelController.java
│   └── ContactController.java
├── service/
│   ├── AuthService.java
│   ├── MailService.java
│   ├── ConversationService.java
│   ├── LabelService.java
│   └── ContactService.java
├── repository/
│   ├── UserRepository.java
│   ├── LabelRepository.java
│   ├── EmailMetadataRepository.java
│   └── ContactRepository.java
├── dto/
│   ├── auth/
│   ├── email/
│   ├── label/
│   └── contact/
├── model/
│   ├── User.java
│   ├── Label.java
│   ├── EmailMetadata.java
│   └── Contact.java
├── security/
│   ├── JwtAuthenticationFilter.java
│   ├── JwtTokenProvider.java
│   └── UserPrincipal.java
├── mail/
│   ├── ImapClientManager.java
│   ├── MessageParser.java
│   └── ConversationThreader.java
└── websocket/
    ├── MailWebSocketHandler.java
    └── NotificationService.java
```

### 2.2 Authentication System (JWT-based)

#### JWT Token Provider
```java
@Component
public class JwtTokenProvider {

    private static final String JWT_SECRET = "mySecretKey";
    private static final int JWT_EXPIRATION = 604800000; // 7 days

    private final Key key;

    public JwtTokenProvider() {
        this.key = Keys.hmacShaKeyFor(JWT_SECRET.getBytes());
    }

    public String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Date expiryDate = new Date(System.currentTimeMillis() + JWT_EXPIRATION);

        return Jwts.builder()
                .subject(userPrincipal.getEmail())
                .issuedAt(new Date())
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith((SecretKey) key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parser().verifyWith((SecretKey) key).build().parseSignedClaims(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
```

#### Authentication Service
```java
@Service
@Transactional
public class AuthService {

    private final MailService mailService;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    public AuthService(MailService mailService, JwtTokenProvider tokenProvider, UserRepository userRepository) {
        this.mailService = mailService;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
    }

    public AuthResponse login(LoginRequest loginRequest) {
        // Validate credentials against Apache James IMAP server
        boolean isValidCredentials = mailService.validateCredentials(
            loginRequest.getEmail(),
            loginRequest.getPassword()
        );

        if (!isValidCredentials) {
            throw new BadCredentialsException("Invalid email or password");
        }

        // Create or update user in database
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseGet(() -> createNewUser(loginRequest.getEmail()));

        // Store encrypted credentials temporarily (for IMAP connections)
        user.setEncryptedPassword(encryptPassword(loginRequest.getPassword()));
        userRepository.save(user);

        // Create authentication token
        Authentication authentication = new UsernamePasswordAuthenticationToken(
            new UserPrincipal(user), null, Collections.emptyList()
        );

        String jwt = tokenProvider.generateToken(authentication);

        return new AuthResponse(jwt, user.getEmail(), user.getDisplayName());
    }

    private User createNewUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setDisplayName(extractDisplayName(email));
        user.setCreatedAt(LocalDateTime.now());
        return user;
    }

    private String extractDisplayName(String email) {
        return email.substring(0, email.indexOf('@'));
    }

    private String encryptPassword(String password) {
        // Implement AES encryption for storing IMAP password
        return password; // Simplified for example
    }
}
```

### 2.3 Core Service (MailService)

#### IMAP Client Manager
```java
@Component
public class ImapClientManager {

    private final Map<String, Store> userStores = new ConcurrentHashMap<>();
    private final MailConfig mailConfig;

    public ImapClientManager(MailConfig mailConfig) {
        this.mailConfig = mailConfig;
    }

    public Store getStore(String userEmail, String password) throws MessagingException {
        String key = userEmail;

        Store store = userStores.get(key);
        if (store == null || !store.isConnected()) {
            store = createNewStore(userEmail, password);
            userStores.put(key, store);
        }

        return store;
    }

    private Store createNewStore(String email, String password) throws MessagingException {
        Properties props = new Properties();
        props.setProperty("mail.imap.host", mailConfig.getImapHost());
        props.setProperty("mail.imap.port", String.valueOf(mailConfig.getImapPort()));
        props.setProperty("mail.imap.ssl.enable", "true");
        props.setProperty("mail.imap.auth", "true");

        Session session = Session.getInstance(props);
        Store store = session.getStore("imap");
        store.connect(email, password);

        return store;
    }

    public void closeStore(String userEmail) {
        Store store = userStores.remove(userEmail);
        if (store != null && store.isConnected()) {
            try {
                store.close();
            } catch (MessagingException e) {
                log.error("Error closing IMAP store", e);
            }
        }
    }
}
```

#### Conversation Threading Logic (Critical Implementation)
```java
@Service
public class ConversationThreader {

    /**
     * Groups messages into conversations using Gmail-like threading logic
     * Priority: Message-ID/References > In-Reply-To > Subject-based grouping
     */
    public List<ConversationDto> groupMessagesIntoConversations(List<Message> messages) {
        Map<String, List<Message>> conversationMap = new HashMap<>();

        for (Message message : messages) {
            String threadId = extractThreadId(message);
            conversationMap.computeIfAbsent(threadId, k -> new ArrayList<>()).add(message);
        }

        return conversationMap.entrySet().stream()
                .map(entry -> createConversationDto(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(ConversationDto::getLastMessageDate).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Critical method: Extract thread ID using Gmail-like algorithm
     */
    private String extractThreadId(Message message) {
        try {
            // Primary: Use Message-ID for thread identification
            String messageId = getHeader(message, "Message-ID");

            // Check if this is a reply - use In-Reply-To header
            String inReplyTo = getHeader(message, "In-Reply-To");
            if (inReplyTo != null) {
                return normalizeMessageId(inReplyTo);
            }

            // Check References header for thread continuation
            String references = getHeader(message, "References");
            if (references != null) {
                String[] refs = references.split("\\s+");
                if (refs.length > 0) {
                    return normalizeMessageId(refs[0]); // First reference is root
                }
            }

            // Fallback: Use subject-based threading
            String subject = message.getSubject();
            if (subject != null) {
                String normalizedSubject = normalizeSubject(subject);
                return "subject:" + normalizedSubject.hashCode();
            }

            // Last resort: Use message ID itself
            return normalizeMessageId(messageId);

        } catch (MessagingException e) {
            return "unknown:" + UUID.randomUUID().toString();
        }
    }

    private String normalizeSubject(String subject) {
        // Remove Re:, Fwd:, etc. and normalize for threading
        return subject.replaceAll("(?i)^(re:|fwd?:|aw:)\\s*", "").trim().toLowerCase();
    }

    private String normalizeMessageId(String messageId) {
        if (messageId == null) return null;
        return messageId.replaceAll("[<>]", "").trim();
    }

    private String getHeader(Message message, String headerName) throws MessagingException {
        String[] headers = message.getHeader(headerName);
        return headers != null && headers.length > 0 ? headers[0] : null;
    }

    private ConversationDto createConversationDto(String threadId, List<Message> messages) {
        // Sort messages by date
        messages.sort(Comparator.comparing(this::getMessageDate));

        Message latestMessage = messages.get(messages.size() - 1);

        try {
            ConversationDto conversation = new ConversationDto();
            conversation.setId(threadId);
            conversation.setSubject(latestMessage.getSubject());
            conversation.setParticipants(extractParticipants(messages));
            conversation.setMessageCount(messages.size());
            conversation.setLastMessageDate(getMessageDate(latestMessage));
            conversation.setHasUnread(hasUnreadMessages(messages));
            conversation.setHasAttachments(hasAttachments(messages));
            conversation.setPreview(extractPreview(latestMessage));

            return conversation;
        } catch (MessagingException e) {
            throw new RuntimeException("Error creating conversation DTO", e);
        }
    }

    private Date getMessageDate(Message message) {
        try {
            return message.getSentDate() != null ? message.getSentDate() : message.getReceivedDate();
        } catch (MessagingException e) {
            return new Date();
        }
    }

    private List<String> extractParticipants(List<Message> messages) {
        Set<String> participants = new HashSet<>();
        for (Message message : messages) {
            try {
                Address[] from = message.getFrom();
                Address[] to = message.getRecipients(Message.RecipientType.TO);

                if (from != null) {
                    for (Address addr : from) {
                        participants.add(addr.toString());
                    }
                }
                if (to != null) {
                    for (Address addr : to) {
                        participants.add(addr.toString());
                    }
                }
            } catch (MessagingException e) {
                // Continue processing other messages
            }
        }
        return new ArrayList<>(participants);
    }

    private boolean hasUnreadMessages(List<Message> messages) {
        return messages.stream().anyMatch(msg -> {
            try {
                return !msg.isSet(Flags.Flag.SEEN);
            } catch (MessagingException e) {
                return false;
            }
        });
    }

    private boolean hasAttachments(List<Message> messages) {
        return messages.stream().anyMatch(this::messageHasAttachments);
    }

    private boolean messageHasAttachments(Message message) {
        try {
            return message.getContent() instanceof Multipart;
        } catch (Exception e) {
            return false;
        }
    }

    private String extractPreview(Message message) {
        try {
            Object content = message.getContent();
            if (content instanceof String) {
                return truncateText((String) content, 100);
            } else if (content instanceof Multipart) {
                return extractTextFromMultipart((Multipart) content, 100);
            }
        } catch (Exception e) {
            // Return empty preview if extraction fails
        }
        return "";
    }

    private String extractTextFromMultipart(Multipart multipart, int maxLength) throws MessagingException, IOException {
        for (int i = 0; i < multipart.getCount(); i++) {
            BodyPart part = multipart.getBodyPart(i);
            if (part.isMimeType("text/plain")) {
                return truncateText((String) part.getContent(), maxLength);
            }
        }
        return "";
    }

    private String truncateText(String text, int maxLength) {
        if (text == null) return "";
        text = text.replaceAll("\\s+", " ").trim();
        return text.length() > maxLength ? text.substring(0, maxLength) + "..." : text;
    }
}
```

#### Main MailService Implementation
```java
@Service
@Transactional
public class MailService {

    private final ImapClientManager imapClientManager;
    private final ConversationThreader conversationThreader;
    private final MessageParser messageParser;
    private final EmailMetadataRepository emailMetadataRepository;
    private final UserRepository userRepository;

    public MailService(ImapClientManager imapClientManager,
                      ConversationThreader conversationThreader,
                      MessageParser messageParser,
                      EmailMetadataRepository emailMetadataRepository,
                      UserRepository userRepository) {
        this.imapClientManager = imapClientManager;
        this.conversationThreader = conversationThreader;
        this.messageParser = messageParser;
        this.emailMetadataRepository = emailMetadataRepository;
        this.userRepository = userRepository;
    }

    /**
     * Validate user credentials against Apache James IMAP server
     */
    public boolean validateCredentials(String email, String password) {
        try {
            Store store = imapClientManager.getStore(email, password);
            return store.isConnected();
        } catch (MessagingException e) {
            log.debug("Authentication failed for user: {}", email);
            return false;
        }
    }

    /**
     * Fetch email conversations with pagination
     */
    public PagedResponse<ConversationDto> getConversations(String userEmail, String folderName,
                                                          int page, int size) {
        try {
            Store store = imapClientManager.getStore(userEmail, getUserPassword(userEmail));
            Folder folder = store.getFolder(folderName);
            folder.open(Folder.READ_ONLY);

            int totalMessages = folder.getMessageCount();
            int startIndex = Math.max(1, totalMessages - (page + 1) * size + 1);
            int endIndex = Math.max(1, totalMessages - page * size);

            Message[] messages = folder.getMessages(startIndex, endIndex);
            List<ConversationDto> conversations = conversationThreader
                .groupMessagesIntoConversations(Arrays.asList(messages));

            folder.close(false);

            return new PagedResponse<>(conversations, page, size, totalMessages / size + 1, totalMessages);

        } catch (MessagingException e) {
            throw new EmailServiceException("Failed to fetch conversations", e);
        }
    }

    /**
     * Fetch full conversation details with all messages
     */
    public ConversationDetailDto getConversation(String userEmail, String conversationId) {
        try {
            Store store = imapClientManager.getStore(userEmail, getUserPassword(userEmail));

            // Search for messages with matching thread ID across all folders
            List<EmailDto> emails = searchMessagesByThreadId(store, conversationId);

            ConversationDetailDto detail = new ConversationDetailDto();
            detail.setId(conversationId);
            detail.setEmails(emails);
            detail.setSubject(emails.isEmpty() ? "" : emails.get(0).getSubject());

            return detail;

        } catch (MessagingException e) {
            throw new EmailServiceException("Failed to fetch conversation details", e);
        }
    }

    /**
     * Send email via SMTP
     */
    public void sendEmail(String userEmail, SendEmailRequest request) {
        try {
            Properties props = new Properties();
            props.put("mail.smtp.host", mailConfig.getSmtpHost());
            props.put("mail.smtp.port", mailConfig.getSmtpPort());
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");

            Session session = Session.getInstance(props, new Authenticator() {
                @Override
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(userEmail, getUserPassword(userEmail));
                }
            });

            MimeMessage message = new MimeMessage(session);
            message.setFrom(new InternetAddress(userEmail));
            message.setRecipients(Message.RecipientType.TO,
                InternetAddress.parse(String.join(",", request.getTo())));

            if (request.getCc() != null && !request.getCc().isEmpty()) {
                message.setRecipients(Message.RecipientType.CC,
                    InternetAddress.parse(String.join(",", request.getCc())));
            }

            message.setSubject(request.getSubject());

            // Handle multipart message with attachments
            if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
                Multipart multipart = new MimeMultipart();

                // Add text content
                MimeBodyPart textPart = new MimeBodyPart();
                textPart.setContent(request.getBody(), "text/html; charset=utf-8");
                multipart.addBodyPart(textPart);

                // Add attachments
                for (AttachmentDto attachment : request.getAttachments()) {
                    MimeBodyPart attachmentPart = new MimeBodyPart();
                    DataSource source = new ByteArrayDataSource(
                        attachment.getData(), attachment.getMimeType());
                    attachmentPart.setDataHandler(new DataHandler(source));
                    attachmentPart.setFileName(attachment.getFileName());
                    multipart.addBodyPart(attachmentPart);
                }

                message.setContent(multipart);
            } else {
                message.setContent(request.getBody(), "text/html; charset=utf-8");
            }

            // Set threading headers if this is a reply
            if (request.getInReplyTo() != null) {
                message.setHeader("In-Reply-To", request.getInReplyTo());
                message.setHeader("References", request.getReferences());
            }

            Transport.send(message);

        } catch (MessagingException e) {
            throw new EmailServiceException("Failed to send email", e);
        }
    }

    /**
     * Perform bulk actions on emails
     */
    public void performBulkAction(String userEmail, BulkActionRequest request) {
        try {
            Store store = imapClientManager.getStore(userEmail, getUserPassword(userEmail));

            for (String messageId : request.getMessageIds()) {
                switch (request.getAction()) {
                    case MARK_AS_READ:
                        markAsRead(store, messageId);
                        break;
                    case MARK_AS_UNREAD:
                        markAsUnread(store, messageId);
                        break;
                    case DELETE:
                        deleteMessage(store, messageId);
                        break;
                    case ARCHIVE:
                        archiveMessage(store, messageId);
                        break;
                    case ADD_LABEL:
                        addLabel(userEmail, messageId, request.getLabelName());
                        break;
                    case REMOVE_LABEL:
                        removeLabel(userEmail, messageId, request.getLabelName());
                        break;
                }
            }

        } catch (MessagingException e) {
            throw new EmailServiceException("Failed to perform bulk action", e);
        }
    }

    /**
     * Search emails with advanced criteria
     */
    public PagedResponse<ConversationDto> searchEmails(String userEmail, SearchCriteria criteria, int page, int size) {
        try {
            Store store = imapClientManager.getStore(userEmail, getUserPassword(userEmail));

            // Build search term
            SearchTerm searchTerm = buildSearchTerm(criteria);

            // Search across all folders
            List<Message> allMatches = new ArrayList<>();
            Folder[] folders = store.getDefaultFolder().list("*");

            for (Folder folder : folders) {
                folder.open(Folder.READ_ONLY);
                Message[] matches = folder.search(searchTerm);
                allMatches.addAll(Arrays.asList(matches));
                folder.close(false);
            }

            // Group into conversations and paginate
            List<ConversationDto> conversations = conversationThreader
                .groupMessagesIntoConversations(allMatches);

            int startIndex = page * size;
            int endIndex = Math.min(startIndex + size, conversations.size());
            List<ConversationDto> pageConversations = conversations.subList(startIndex, endIndex);

            return new PagedResponse<>(pageConversations, page, size,
                (conversations.size() + size - 1) / size, conversations.size());

        } catch (MessagingException e) {
            throw new EmailServiceException("Failed to search emails", e);
        }
    }

    private SearchTerm buildSearchTerm(SearchCriteria criteria) {
        List<SearchTerm> terms = new ArrayList<>();

        if (criteria.getQuery() != null && !criteria.getQuery().isEmpty()) {
            terms.add(new OrTerm(
                new SubjectTerm(criteria.getQuery()),
                new BodyTerm(criteria.getQuery())
            ));
        }

        if (criteria.getFrom() != null) {
            terms.add(new FromStringTerm(criteria.getFrom()));
        }

        if (criteria.getTo() != null) {
            terms.add(new RecipientStringTerm(Message.RecipientType.TO, criteria.getTo()));
        }

        if (criteria.getAfter() != null) {
            terms.add(new SentDateTerm(ComparisonTerm.GT,
                Date.from(criteria.getAfter().atStartOfDay(ZoneId.systemDefault()).toInstant())));
        }

        if (criteria.getBefore() != null) {
            terms.add(new SentDateTerm(ComparisonTerm.LT,
                Date.from(criteria.getBefore().atStartOfDay(ZoneId.systemDefault()).toInstant())));
        }

        if (terms.isEmpty()) {
            return new SubjectTerm(""); // Match all
        } else if (terms.size() == 1) {
            return terms.get(0);
        } else {
            return new AndTerm(terms.toArray(new SearchTerm[0]));
        }
    }

    private String getUserPassword(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return decryptPassword(user.getEncryptedPassword());
    }

    private String decryptPassword(String encryptedPassword) {
        // Implement AES decryption
        return encryptedPassword; // Simplified for example
    }

    // Additional helper methods for IMAP operations...
    private void markAsRead(Store store, String messageId) throws MessagingException {
        Message message = findMessageById(store, messageId);
        if (message != null) {
            message.setFlag(Flags.Flag.SEEN, true);
        }
    }

    private void markAsUnread(Store store, String messageId) throws MessagingException {
        Message message = findMessageById(store, messageId);
        if (message != null) {
            message.setFlag(Flags.Flag.SEEN, false);
        }
    }

    private void deleteMessage(Store store, String messageId) throws MessagingException {
        Message message = findMessageById(store, messageId);
        if (message != null) {
            message.setFlag(Flags.Flag.DELETED, true);
        }
    }

    private void archiveMessage(Store store, String messageId) throws MessagingException {
        // Move to Archive folder (implementation depends on server setup)
        Message message = findMessageById(store, messageId);
        if (message != null) {
            Folder archiveFolder = store.getFolder("Archive");
            if (!archiveFolder.exists()) {
                archiveFolder.create(Folder.HOLDS_MESSAGES);
            }
            archiveFolder.open(Folder.READ_WRITE);
            message.getFolder().copyMessages(new Message[]{message}, archiveFolder);
            message.setFlag(Flags.Flag.DELETED, true);
            archiveFolder.close(false);
        }
    }

    private Message findMessageById(Store store, String messageId) throws MessagingException {
        // Implementation to find message by ID across folders
        // This would typically involve searching through folders
        return null; // Simplified for example
    }

    private List<EmailDto> searchMessagesByThreadId(Store store, String threadId) {
        // Implementation to search messages by thread ID
        return new ArrayList<>(); // Simplified for example
    }
}
```

### 2.4 API Endpoint Design (RESTful Controllers)

#### Email Controller (Complete Implementation)
```java
@RestController
@RequestMapping("/api/emails")
@CrossOrigin
@Validated
public class EmailController {

    private final MailService mailService;
    private final NotificationService notificationService;

    public EmailController(MailService mailService, NotificationService notificationService) {
        this.mailService = mailService;
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<PagedResponse<ConversationDto>> getConversations(
            @RequestParam(defaultValue = "INBOX") String folder,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication authentication) {

        String userEmail = authentication.getName();
        PagedResponse<ConversationDto> conversations = mailService.getConversations(
            userEmail, folder, page, size);

        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<ConversationDetailDto> getConversation(
            @PathVariable String conversationId,
            Authentication authentication) {

        String userEmail = authentication.getName();
        ConversationDetailDto conversation = mailService.getConversation(userEmail, conversationId);

        return ResponseEntity.ok(conversation);
    }

    @PostMapping("/send")
    public ResponseEntity<ApiResponse> sendEmail(
            @Valid @RequestBody SendEmailRequest request,
            Authentication authentication) {

        String userEmail = authentication.getName();
        mailService.sendEmail(userEmail, request);

        // Notify via WebSocket
        notificationService.notifyEmailSent(userEmail, request.getSubject());

        return ResponseEntity.ok(new ApiResponse(true, "Email sent successfully"));
    }

    @PostMapping("/actions")
    public ResponseEntity<ApiResponse> performBulkAction(
            @Valid @RequestBody BulkActionRequest request,
            Authentication authentication) {

        String userEmail = authentication.getName();
        mailService.performBulkAction(userEmail, request);

        return ResponseEntity.ok(new ApiResponse(true, "Action performed successfully"));
    }

    @GetMapping("/search")
    public ResponseEntity<PagedResponse<ConversationDto>> searchEmails(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate after,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate before,
            Authentication authentication) {

        String userEmail = authentication.getName();
        SearchCriteria criteria = SearchCriteria.builder()
            .query(query)
            .from(from)
            .to(to)
            .subject(subject)
            .after(after)
            .before(before)
            .build();

        PagedResponse<ConversationDto> results = mailService.searchEmails(userEmail, criteria, page, size);

        return ResponseEntity.ok(results);
    }

    @GetMapping("/{messageId}/attachments/{attachmentIndex}")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable String messageId,
            @PathVariable int attachmentIndex,
            Authentication authentication) {

        String userEmail = authentication.getName();
        AttachmentDto attachment = mailService.getAttachment(userEmail, messageId, attachmentIndex);

        ByteArrayResource resource = new ByteArrayResource(attachment.getData());

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + attachment.getFileName() + "\"")
            .contentType(MediaType.parseMediaType(attachment.getMimeType()))
            .contentLength(attachment.getData().length)
            .body(resource);
    }

    @GetMapping("/folders")
    public ResponseEntity<List<FolderDto>> getFolders(Authentication authentication) {
        String userEmail = authentication.getName();
        List<FolderDto> folders = mailService.getFolders(userEmail);
        return ResponseEntity.ok(folders);
    }
}
```

#### Complete API Endpoints Summary
```java
// Authentication Endpoints
POST   /api/auth/login           // User login with IMAP validation
POST   /api/auth/logout          // User logout
POST   /api/auth/refresh         // Refresh JWT token

// Email Endpoints
GET    /api/emails               // Get conversations (paginated)
       ?folder=INBOX&page=0&size=50
GET    /api/emails/{conversationId}  // Get conversation details
POST   /api/emails/send          // Send new email
POST   /api/emails/actions       // Bulk actions (mark read, delete, etc.)
       body: {"ids": [1,2], "action": "MARK_AS_READ"}
GET    /api/emails/search        // Search emails with filters
       ?query=...&from=...&to=...&after=...&before=...
GET    /api/emails/{messageId}/attachments/{index}  // Download attachment
GET    /api/emails/folders       // List IMAP folders

// Label Endpoints
GET    /api/labels               // Get user labels
POST   /api/labels               // Create new label
PUT    /api/labels/{labelId}     // Update label
DELETE /api/labels/{labelId}     // Delete label
GET    /api/labels/{labelName}/conversations  // Get emails by label

// Contact Endpoints
GET    /api/contacts             // Get contacts
POST   /api/contacts             // Create contact
PUT    /api/contacts/{contactId} // Update contact
DELETE /api/contacts/{contactId} // Delete contact
GET    /api/contacts/search      // Search contacts

// User Preferences
GET    /api/user/preferences     // Get user preferences
PUT    /api/user/preferences     // Update preferences
```

### 2.5 Database Schema (PostgreSQL JPA Entities)

The complete database schema is already implemented in the migration file at:
`/backend/src/main/resources/db/migration/V1__Initial_schema.sql`

Key entities include:
- **Users**: Authentication and user data
- **UserPreferences**: Customizable settings
- **Labels**: Custom email organization
- **EmailMetadata**: Cached email information and labels
- **Contacts**: Address book functionality
- **EmailLabels**: Many-to-many relationship between emails and labels

---

## 3. Frontend Development Plan (Angular 20)

### 3.1 Project Setup

#### Required npm packages for package.json
```json
{
  "dependencies": {
    "@angular/animations": "^20.0.0",
    "@angular/cdk": "^20.0.0",
    "@angular/common": "^20.0.0",
    "@angular/compiler": "^20.0.0",
    "@angular/core": "^20.0.0",
    "@angular/forms": "^20.0.0",
    "@angular/material": "^20.0.0",
    "@angular/platform-browser": "^20.0.0",
    "@angular/platform-browser-dynamic": "^20.0.0",
    "@angular/router": "^20.0.0",
    "@angular/service-worker": "^20.0.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.14.0",

    // Rich Text Editor
    "quill": "^1.3.7",
    "ngx-quill": "^25.0.0",

    // Date utilities
    "date-fns": "^2.30.0",

    // HTTP client enhancements
    "@angular/common/http": "^20.0.0",

    // WebSocket
    "rxjs/webSocket": "~7.8.0",

    // UI Utilities
    "@angular/flex-layout": "^15.0.0",
    "lodash": "^4.17.21",

    // File handling
    "file-saver": "^2.0.5"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^20.0.0",
    "@angular/cli": "^20.0.0",
    "@angular/compiler-cli": "^20.0.0",
    "@types/jasmine": "~5.1.0",
    "@types/lodash": "^4.14.195",
    "@types/file-saver": "^2.0.7",
    "jasmine-core": "~5.1.0",
    "karma": "~6.4.0",
    "karma-chrome-headless": "~3.1.0",
    "karma-coverage": "~2.2.0",
    "karma-jasmine": "~5.1.0",
    "karma-jasmine-html-reporter": "~2.1.0",
    "typescript": "~5.4.0"
  }
}
```

### 3.2 Folder Structure
```
src/app/
├── core/                    # Core services, guards, interceptors
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── interceptors/
│   │   └── auth.interceptor.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── mail.service.ts
│   │   └── websocket.service.ts
│   └── core.module.ts
│
├── shared/                  # Shared components, pipes, directives
│   ├── components/
│   │   ├── loading/
│   │   ├── confirm-dialog/
│   │   └── error-message/
│   ├── pipes/
│   │   ├── date-format.pipe.ts
│   │   └── truncate.pipe.ts
│   ├── models/
│   │   ├── email.models.ts
│   │   ├── auth.models.ts
│   │   └── api.models.ts
│   └── shared.module.ts
│
├── features/                # Feature modules
│   ├── auth/
│   │   ├── components/
│   │   │   └── login/
│   │   ├── services/
│   │   └── auth.module.ts
│   │
│   ├── mail/
│   │   ├── components/
│   │   │   ├── mail-list/
│   │   │   ├── mail-detail/
│   │   │   ├── compose/
│   │   │   └── conversation/
│   │   ├── services/
│   │   └── mail.module.ts
│   │
│   ├── contacts/
│   │   ├── components/
│   │   ├── services/
│   │   └── contacts.module.ts
│   │
│   └── settings/
│       ├── components/
│       ├── services/
│       └── settings.module.ts
│
├── layout/                  # Layout components
│   ├── header/
│   ├── sidebar/
│   ├── mail-layout/
│   └── layout.module.ts
│
├── material/                # Angular Material configuration
│   └── material.module.ts
│
├── app-routing.module.ts
├── app.component.ts
├── app.component.html
├── app.component.scss
└── app.module.ts
```

### 3.3 Core Components Implementation

#### MailLayoutComponent (Main Shell)
```typescript
@Component({
  selector: 'app-mail-layout',
  template: `
    <div class="mail-layout">
      <mat-sidenav-container class="sidenav-container">

        <!-- Sidebar -->
        <mat-sidenav #drawer class="sidenav" fixedInViewport
                     [attr.role]="'navigation'"
                     [mode]="'side'"
                     [opened]="true">
          <app-sidebar></app-sidebar>
        </mat-sidenav>

        <!-- Main content -->
        <mat-sidenav-content>
          <app-header (menuToggle)="drawer.toggle()"></app-header>

          <div class="main-content">
            <router-outlet></router-outlet>
          </div>
        </mat-sidenav-content>

      </mat-sidenav-container>
    </div>
  `,
  styleUrls: ['./mail-layout.component.scss']
})
export class MailLayoutComponent {
  // Layout logic here
}
```

#### MailListComponent (Conversation List)
```typescript
@Component({
  selector: 'app-mail-list',
  template: `
    <div class="mail-list">
      <div class="toolbar">
        <div class="search-box">
          <mat-form-field appearance="outline">
            <mat-label>Search emails</mat-label>
            <input matInput
                   [(ngModel)]="searchQuery"
                   (keyup.enter)="onSearch()"
                   placeholder="Search emails...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>

        <div class="actions" *ngIf="selectedConversations.length > 0">
          <button mat-icon-button (click)="markAsRead()" matTooltip="Mark as read">
            <mat-icon>mark_email_read</mat-icon>
          </button>
          <button mat-icon-button (click)="archive()" matTooltip="Archive">
            <mat-icon>archive</mat-icon>
          </button>
          <button mat-icon-button (click)="delete()" matTooltip="Delete">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </div>

      <div class="conversations-container">
        <cdk-virtual-scroll-viewport itemSize="80" class="conversation-viewport">
          <div *cdkVirtualFor="let conversation of conversations$ | async; trackBy: trackByConversation"
               class="conversation-item"
               [class.selected]="isSelected(conversation.id)"
               [class.unread]="conversation.hasUnread"
               (click)="selectConversation(conversation)"
               (dblclick)="openConversation(conversation)">

            <div class="conversation-header">
              <mat-checkbox
                [checked]="isSelected(conversation.id)"
                (change)="toggleSelection(conversation.id, $event)"
                (click)="$event.stopPropagation()">
              </mat-checkbox>

              <mat-icon *ngIf="conversation.isStarred" class="star-icon">star</mat-icon>
              <mat-icon *ngIf="conversation.hasAttachments" class="attachment-icon">attach_file</mat-icon>
            </div>

            <div class="conversation-content">
              <div class="participants">
                <span *ngFor="let participant of conversation.participants | slice:0:3">
                  {{ participant | participantName }}
                </span>
                <span *ngIf="conversation.participants.length > 3">
                  +{{ conversation.participants.length - 3 }} more
                </span>
              </div>

              <div class="subject">{{ conversation.subject }}</div>
              <div class="preview">{{ conversation.preview }}</div>

              <div class="metadata">
                <span class="date">{{ conversation.lastMessageDate | dateFormat }}</span>
                <span class="count" *ngIf="conversation.messageCount > 1">
                  ({{ conversation.messageCount }})
                </span>
              </div>
            </div>

            <div class="labels">
              <mat-chip-listbox>
                <mat-chip *ngFor="let label of conversation.labels">
                  {{ label.name }}
                </mat-chip>
              </mat-chip-listbox>
            </div>
          </div>
        </cdk-virtual-scroll-viewport>
      </div>

      <mat-paginator
        [length]="totalConversations"
        [pageSize]="pageSize"
        [pageSizeOptions]="[25, 50, 100]"
        (page)="onPageChange($event)">
      </mat-paginator>
    </div>
  `,
  styleUrls: ['./mail-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MailListComponent implements OnInit, OnDestroy {
  conversations$ = new BehaviorSubject<ConversationDto[]>([]);
  selectedConversations = new Set<string>();
  searchQuery = '';
  currentFolder = 'INBOX';
  pageSize = 50;
  currentPage = 0;
  totalConversations = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private mailService: MailService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadConversations();
    this.setupRealTimeUpdates();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConversations() {
    this.mailService.getConversations(this.currentFolder, this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.conversations$.next(response.content);
        this.totalConversations = response.totalElements;
        this.cdr.markForCheck();
      });
  }

  setupRealTimeUpdates() {
    this.mailService.getNewEmailNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadConversations(); // Refresh on new emails
      });
  }

  selectConversation(conversation: ConversationDto) {
    if (this.selectedConversations.has(conversation.id)) {
      this.selectedConversations.delete(conversation.id);
    } else {
      this.selectedConversations.add(conversation.id);
    }
  }

  openConversation(conversation: ConversationDto) {
    this.router.navigate(['/inbox', conversation.id]);
  }

  markAsRead() {
    const ids = Array.from(this.selectedConversations);
    this.mailService.performBulkAction({
      ids,
      action: 'MARK_AS_READ'
    }).subscribe(() => {
      this.loadConversations();
      this.selectedConversations.clear();
    });
  }

  archive() {
    const ids = Array.from(this.selectedConversations);
    this.mailService.performBulkAction({
      ids,
      action: 'ARCHIVE'
    }).subscribe(() => {
      this.loadConversations();
      this.selectedConversations.clear();
    });
  }

  delete() {
    const ids = Array.from(this.selectedConversations);
    this.mailService.performBulkAction({
      ids,
      action: 'DELETE'
    }).subscribe(() => {
      this.loadConversations();
      this.selectedConversations.clear();
    });
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.mailService.searchEmails(this.searchQuery, 0, this.pageSize)
        .subscribe(response => {
          this.conversations$.next(response.content);
          this.totalConversations = response.totalElements;
          this.cdr.markForCheck();
        });
    } else {
      this.loadConversations();
    }
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadConversations();
  }

  trackByConversation(index: number, conversation: ConversationDto): string {
    return conversation.id;
  }

  isSelected(conversationId: string): boolean {
    return this.selectedConversations.has(conversationId);
  }

  toggleSelection(conversationId: string, event: MatCheckboxChange) {
    if (event.checked) {
      this.selectedConversations.add(conversationId);
    } else {
      this.selectedConversations.delete(conversationId);
    }
  }
}
```

#### MailDetailComponent (Conversation View)
```typescript
@Component({
  selector: 'app-mail-detail',
  template: `
    <div class="mail-detail" *ngIf="conversation$ | async as conversation">
      <div class="conversation-header">
        <div class="subject">{{ conversation.subject }}</div>
        <div class="actions">
          <button mat-icon-button (click)="reply()" matTooltip="Reply">
            <mat-icon>reply</mat-icon>
          </button>
          <button mat-icon-button (click)="replyAll()" matTooltip="Reply All">
            <mat-icon>reply_all</mat-icon>
          </button>
          <button mat-icon-button (click)="forward()" matTooltip="Forward">
            <mat-icon>forward</mat-icon>
          </button>
          <button mat-icon-button (click)="archive()" matTooltip="Archive">
            <mat-icon>archive</mat-icon>
          </button>
          <button mat-icon-button (click)="delete()" matTooltip="Delete">
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </div>

      <div class="emails-container">
        <div *ngFor="let email of conversation.emails; trackBy: trackByEmail"
             class="email-item"
             [class.expanded]="email.isExpanded">

          <div class="email-header" (click)="toggleEmailExpansion(email)">
            <div class="sender">
              <mat-icon class="avatar">account_circle</mat-icon>
              <span class="name">{{ email.from | senderName }}</span>
              <span class="email">{{ email.from | senderEmail }}</span>
            </div>

            <div class="metadata">
              <span class="date">{{ email.sentDate | dateFormat:'full' }}</span>
              <mat-icon class="expand-icon"
                       [class.rotated]="email.isExpanded">
                expand_more
              </mat-icon>
            </div>
          </div>

          <div class="email-content" [class.collapsed]="!email.isExpanded">
            <div class="recipients" *ngIf="email.isExpanded">
              <div *ngIf="email.to?.length">
                <strong>To:</strong> {{ email.to.join(', ') }}
              </div>
              <div *ngIf="email.cc?.length">
                <strong>CC:</strong> {{ email.cc.join(', ') }}
              </div>
            </div>

            <div class="body" [innerHTML]="email.htmlBody || email.textBody | sanitizeHtml">
            </div>

            <div class="attachments" *ngIf="email.attachments?.length">
              <div class="attachments-header">
                <mat-icon>attach_file</mat-icon>
                <span>{{ email.attachments.length }} attachment(s)</span>
              </div>

              <div class="attachment-list">
                <div *ngFor="let attachment of email.attachments"
                     class="attachment-item"
                     (click)="downloadAttachment(email.id, attachment.index)">
                  <mat-icon>{{ getAttachmentIcon(attachment.mimeType) }}</mat-icon>
                  <span class="filename">{{ attachment.fileName }}</span>
                  <span class="size">({{ attachment.size | fileSize }})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Reply -->
      <div class="quick-reply" *ngIf="showQuickReply">
        <app-compose
          [isQuickReply]="true"
          [replyToEmail]="getLatestEmail(conversation)"
          (emailSent)="onEmailSent()"
          (cancelled)="showQuickReply = false">
        </app-compose>
      </div>
    </div>
  `,
  styleUrls: ['./mail-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MailDetailComponent implements OnInit, OnDestroy {
  conversation$ = new BehaviorSubject<ConversationDetailDto | null>(null);
  conversationId!: string;
  showQuickReply = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private mailService: MailService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        this.conversationId = params['id'];
        return this.mailService.getConversation(this.conversationId);
      })
    ).subscribe(conversation => {
      // Expand the latest email by default
      if (conversation.emails.length > 0) {
        conversation.emails[conversation.emails.length - 1].isExpanded = true;
      }
      this.conversation$.next(conversation);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleEmailExpansion(email: EmailDto) {
    email.isExpanded = !email.isExpanded;
    this.cdr.markForCheck();
  }

  reply() {
    this.showQuickReply = true;
  }

  replyAll() {
    // Implement reply all logic
  }

  forward() {
    // Implement forward logic
  }

  archive() {
    this.mailService.performBulkAction({
      ids: [this.conversationId],
      action: 'ARCHIVE'
    }).subscribe(() => {
      this.router.navigate(['/inbox']);
    });
  }

  delete() {
    this.mailService.performBulkAction({
      ids: [this.conversationId],
      action: 'DELETE'
    }).subscribe(() => {
      this.router.navigate(['/inbox']);
    });
  }

  downloadAttachment(emailId: string, attachmentIndex: number) {
    this.mailService.downloadAttachment(emailId, attachmentIndex)
      .subscribe(blob => {
        // Handle file download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attachment';
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }

  onEmailSent() {
    this.showQuickReply = false;
    // Refresh conversation to show new email
    this.ngOnInit();
  }

  getLatestEmail(conversation: ConversationDetailDto): EmailDto {
    return conversation.emails[conversation.emails.length - 1];
  }

  trackByEmail(index: number, email: EmailDto): string {
    return email.id;
  }

  getAttachmentIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf')) return 'picture_as_pdf';
    if (mimeType.includes('word')) return 'description';
    if (mimeType.includes('excel')) return 'table_chart';
    return 'attach_file';
  }
}
```

#### ComposeComponent (Rich Text Email Editor)
```typescript
@Component({
  selector: 'app-compose',
  template: `
    <div class="compose-container" [class.quick-reply]="isQuickReply">
      <div class="compose-header" *ngIf="!isQuickReply">
        <h2>{{ isReply ? 'Reply' : 'New Message' }}</h2>
        <button mat-icon-button (click)="cancel()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="composeForm" (ngSubmit)="sendEmail()">
        <div class="email-fields">
          <mat-form-field appearance="outline" class="recipient-field">
            <mat-label>To</mat-label>
            <mat-chip-grid #chipGrid>
              <mat-chip-row *ngFor="let recipient of recipients"
                           (removed)="removeRecipient(recipient)">
                {{ recipient }}
                <mat-icon matChipRemove>cancel</mat-icon>
              </mat-chip-row>
            </mat-chip-grid>
            <input matInput
                   [matChipInputFor]="chipGrid"
                   [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
                   [matChipInputAddOnBlur]="true"
                   (matChipInputTokenEnd)="addRecipient($event)"
                   placeholder="Enter email addresses..."
                   formControlName="to">
          </mat-form-field>

          <div class="cc-bcc-toggle" *ngIf="!showCcBcc">
            <button type="button" mat-button (click)="showCcBcc = true">
              CC/BCC
            </button>
          </div>

          <div class="cc-bcc-fields" *ngIf="showCcBcc">
            <mat-form-field appearance="outline">
              <mat-label>CC</mat-label>
              <input matInput formControlName="cc" placeholder="CC recipients">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>BCC</mat-label>
              <input matInput formControlName="bcc" placeholder="BCC recipients">
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Subject</mat-label>
            <input matInput formControlName="subject" placeholder="Subject">
          </mat-form-field>
        </div>

        <!-- Rich Text Editor -->
        <div class="editor-container">
          <quill-editor
            [modules]="editorModules"
            [styles]="editorStyles"
            formControlName="body"
            placeholder="Write your message...">
          </quill-editor>
        </div>

        <!-- Attachments -->
        <div class="attachments-section">
          <input #fileInput
                 type="file"
                 multiple
                 style="display: none"
                 (change)="onFileSelected($event)">

          <div class="attachment-list" *ngIf="attachments.length > 0">
            <div *ngFor="let attachment of attachments; let i = index"
                 class="attachment-item">
              <mat-icon>{{ getFileIcon(attachment.type) }}</mat-icon>
              <span class="filename">{{ attachment.name }}</span>
              <span class="size">({{ attachment.size | fileSize }})</span>
              <button mat-icon-button (click)="removeAttachment(i)">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="compose-actions">
          <button mat-raised-button
                  color="primary"
                  type="submit"
                  [disabled]="composeForm.invalid || isSending">
            <mat-icon *ngIf="isSending">hourglass_empty</mat-icon>
            <span>{{ isSending ? 'Sending...' : 'Send' }}</span>
          </button>

          <button mat-button
                  type="button"
                  (click)="attachFile()">
            <mat-icon>attach_file</mat-icon>
            Attach
          </button>

          <button mat-button
                  type="button"
                  (click)="saveDraft()">
            <mat-icon>save</mat-icon>
            Save Draft
          </button>

          <button mat-button
                  type="button"
                  (click)="cancel()">
            Cancel
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./compose.component.scss']
})
export class ComposeComponent implements OnInit {
  @Input() isQuickReply = false;
  @Input() isReply = false;
  @Input() replyToEmail?: EmailDto;
  @Output() emailSent = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  composeForm!: FormGroup;
  recipients: string[] = [];
  attachments: File[] = [];
  showCcBcc = false;
  isSending = false;

  separatorKeysCodes: number[] = [ENTER, COMMA];

  editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean']
    ]
  };

  editorStyles = {
    height: '300px'
  };

  constructor(
    private fb: FormBuilder,
    private mailService: MailService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.initializeForm();

    if (this.replyToEmail) {
      this.populateReplyFields();
    }
  }

  initializeForm() {
    this.composeForm = this.fb.group({
      to: ['', Validators.required],
      cc: [''],
      bcc: [''],
      subject: ['', Validators.required],
      body: ['', Validators.required]
    });
  }

  populateReplyFields() {
    if (!this.replyToEmail) return;

    const subject = this.replyToEmail.subject.startsWith('Re:')
      ? this.replyToEmail.subject
      : `Re: ${this.replyToEmail.subject}`;

    this.composeForm.patchValue({
      to: this.replyToEmail.from,
      subject: subject,
      body: this.createReplyBody()
    });
  }

  createReplyBody(): string {
    if (!this.replyToEmail) return '';

    const date = new Date(this.replyToEmail.sentDate).toLocaleString();
    const originalText = this.replyToEmail.textBody || '';

    return `

<div class="gmail_quote">
  <div dir="ltr" class="gmail_attr">
    On ${date}, ${this.replyToEmail.from} wrote:
  </div>
  <blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">
    ${originalText}
  </blockquote>
</div>`;
  }

  addRecipient(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.isValidEmail(value)) {
      this.recipients.push(value);
      event.chipInput!.clear();
    }
  }

  removeRecipient(recipient: string): void {
    const index = this.recipients.indexOf(recipient);
    if (index >= 0) {
      this.recipients.splice(index, 1);
    }
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  attachFile() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.attachments.push(files[i]);
      }
    }
  }

  removeAttachment(index: number) {
    this.attachments.splice(index, 1);
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf')) return 'picture_as_pdf';
    if (mimeType.includes('word')) return 'description';
    if (mimeType.includes('excel')) return 'table_chart';
    return 'attach_file';
  }

  sendEmail() {
    if (this.composeForm.invalid) return;

    this.isSending = true;
    const formValue = this.composeForm.value;

    const emailRequest: SendEmailRequest = {
      to: this.recipients,
      cc: formValue.cc ? formValue.cc.split(',').map((s: string) => s.trim()) : [],
      bcc: formValue.bcc ? formValue.bcc.split(',').map((s: string) => s.trim()) : [],
      subject: formValue.subject,
      body: formValue.body,
      attachments: this.attachments.map(file => ({
        fileName: file.name,
        mimeType: file.type,
        data: file // This would need to be converted to base64
      })),
      inReplyTo: this.replyToEmail?.messageId,
      references: this.replyToEmail?.references
    };

    this.mailService.sendEmail(emailRequest).subscribe({
      next: () => {
        this.isSending = false;
        this.snackBar.open('Email sent successfully!', 'Close', { duration: 3000 });
        this.emailSent.emit();
        this.resetForm();
      },
      error: (error) => {
        this.isSending = false;
        this.snackBar.open('Failed to send email. Please try again.', 'Close', { duration: 5000 });
        console.error('Send email error:', error);
      }
    });
  }

  saveDraft() {
    // Implement save draft functionality
    this.snackBar.open('Draft saved', 'Close', { duration: 2000 });
  }

  cancel() {
    this.cancelled.emit();
    this.resetForm();
  }

  resetForm() {
    this.composeForm.reset();
    this.recipients = [];
    this.attachments = [];
    this.showCcBcc = false;
  }
}
```

### 3.4 State Management

#### Using Angular Signals (Modern Approach)
```typescript
@Injectable({
  providedIn: 'root'
})
export class MailStateService {
  private _conversations = signal<ConversationDto[]>([]);
  private _selectedConversation = signal<ConversationDetailDto | null>(null);
  private _currentFolder = signal<string>('INBOX');
  private _unreadCount = signal<number>(0);
  private _labels = signal<LabelDto[]>([]);

  // Read-only computed signals
  conversations = this._conversations.asReadonly();
  selectedConversation = this._selectedConversation.asReadonly();
  currentFolder = this._currentFolder.asReadonly();
  unreadCount = this._unreadCount.asReadonly();
  labels = this._labels.asReadonly();

  // Computed values
  unreadConversations = computed(() =>
    this._conversations().filter(conv => conv.hasUnread)
  );

  conversationsByLabel = computed(() => {
    const conversations = this._conversations();
    const groupedByLabel: Record<string, ConversationDto[]> = {};

    conversations.forEach(conv => {
      conv.labels?.forEach(label => {
        if (!groupedByLabel[label.name]) {
          groupedByLabel[label.name] = [];
        }
        groupedByLabel[label.name].push(conv);
      });
    });

    return groupedByLabel;
  });

  constructor(private mailService: MailService) {
    this.loadInitialData();
  }

  // Actions
  setConversations(conversations: ConversationDto[]) {
    this._conversations.set(conversations);
    this.updateUnreadCount();
  }

  addConversation(conversation: ConversationDto) {
    this._conversations.update(conversations => [...conversations, conversation]);
    this.updateUnreadCount();
  }

  updateConversation(conversationId: string, updates: Partial<ConversationDto>) {
    this._conversations.update(conversations =>
      conversations.map(conv =>
        conv.id === conversationId ? { ...conv, ...updates } : conv
      )
    );
    this.updateUnreadCount();
  }

  removeConversation(conversationId: string) {
    this._conversations.update(conversations =>
      conversations.filter(conv => conv.id !== conversationId)
    );
    this.updateUnreadCount();
  }

  setSelectedConversation(conversation: ConversationDetailDto | null) {
    this._selectedConversation.set(conversation);
  }

  setCurrentFolder(folder: string) {
    this._currentFolder.set(folder);
  }

  setLabels(labels: LabelDto[]) {
    this._labels.set(labels);
  }

  addLabel(label: LabelDto) {
    this._labels.update(labels => [...labels, label]);
  }

  updateLabel(labelId: string, updates: Partial<LabelDto>) {
    this._labels.update(labels =>
      labels.map(label =>
        label.id === labelId ? { ...label, ...updates } : label
      )
    );
  }

  removeLabel(labelId: string) {
    this._labels.update(labels =>
      labels.filter(label => label.id !== labelId)
    );
  }

  private updateUnreadCount() {
    const unread = this._conversations().filter(conv => conv.hasUnread).length;
    this._unreadCount.set(unread);
  }

  private loadInitialData() {
    // Load initial conversations, labels, etc.
    this.mailService.getConversations('INBOX', 0, 50).subscribe(response => {
      this.setConversations(response.content);
    });

    this.mailService.getLabels().subscribe(labels => {
      this.setLabels(labels);
    });
  }
}
```

### 3.5 Services Implementation

#### AuthService (Complete)
```typescript
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'memail_token';
  private readonly USER_KEY = 'memail_user';

  private _isAuthenticated = signal(false);
  private _currentUser = signal<User | null>(null);

  isAuthenticated = this._isAuthenticated.asReadonly();
  currentUser = this._currentUser.asReadonly();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth() {
    const token = this.getToken();
    const user = this.getStoredUser();

    if (token && user && !this.isTokenExpired(token)) {
      this._isAuthenticated.set(true);
      this._currentUser.set(user);
    } else {
      this.logout();
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials)
      .pipe(
        tap(response => {
          this.setToken(response.token);
          this.setUser({
            email: response.email,
            displayName: response.displayName
          });
          this._isAuthenticated.set(true);
          this._currentUser.set({
            email: response.email,
            displayName: response.displayName
          });
        })
      );
  }

  logout(): void {
    this.http.post('/api/auth/logout', {}).subscribe({
      complete: () => {
        this.clearAuthData();
      },
      error: () => {
        this.clearAuthData();
      }
    });
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/refresh', {})
      .pipe(
        tap(response => {
          this.setToken(response.token);
        }),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        })
      );
  }

  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private getStoredUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
```

#### MailService (Angular Service)
```typescript
@Injectable({
  providedIn: 'root'
})
export class MailService {
  private readonly API_BASE = '/api/emails';

  constructor(
    private http: HttpClient,
    private webSocketService: WebSocketService
  ) {}

  getConversations(folder: string = 'INBOX', page: number = 0, size: number = 50): Observable<PagedResponse<ConversationDto>> {
    const params = new HttpParams()
      .set('folder', folder)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PagedResponse<ConversationDto>>(this.API_BASE, { params });
  }

  getConversation(conversationId: string): Observable<ConversationDetailDto> {
    return this.http.get<ConversationDetailDto>(`${this.API_BASE}/${conversationId}`);
  }

  sendEmail(emailRequest: SendEmailRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API_BASE}/send`, emailRequest);
  }

  performBulkAction(actionRequest: BulkActionRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.API_BASE}/actions`, actionRequest);
  }

  searchEmails(query: string, page: number = 0, size: number = 20, filters?: SearchFilters): Observable<PagedResponse<ConversationDto>> {
    let params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters) {
      if (filters.from) params = params.set('from', filters.from);
      if (filters.to) params = params.set('to', filters.to);
      if (filters.subject) params = params.set('subject', filters.subject);
      if (filters.after) params = params.set('after', filters.after.toISOString().split('T')[0]);
      if (filters.before) params = params.set('before', filters.before.toISOString().split('T')[0]);
    }

    return this.http.get<PagedResponse<ConversationDto>>(`${this.API_BASE}/search`, { params });
  }

  downloadAttachment(messageId: string, attachmentIndex: number): Observable<Blob> {
    return this.http.get(`${this.API_BASE}/${messageId}/attachments/${attachmentIndex}`, {
      responseType: 'blob'
    });
  }

  getFolders(): Observable<FolderDto[]> {
    return this.http.get<FolderDto[]>(`${this.API_BASE}/folders`);
  }

  getLabels(): Observable<LabelDto[]> {
    return this.http.get<LabelDto[]>('/api/labels');
  }

  createLabel(label: CreateLabelRequest): Observable<LabelDto> {
    return this.http.post<LabelDto>('/api/labels', label);
  }

  updateLabel(labelId: string, updates: UpdateLabelRequest): Observable<LabelDto> {
    return this.http.put<LabelDto>(`/api/labels/${labelId}`, updates);
  }

  deleteLabel(labelId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`/api/labels/${labelId}`);
  }

  getNewEmailNotifications(): Observable<EmailNotification> {
    return this.webSocketService.connect('/ws/notifications')
      .pipe(
        filter(message => message.type === 'NEW_EMAIL'),
        map(message => message.data as EmailNotification)
      );
  }
}
```

### 3.6 Routing Configuration

#### App Routing Module
```typescript
const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: '',
    component: MailLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: '/inbox',
        pathMatch: 'full'
      },
      {
        path: 'inbox',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/mail/components/mail-list/mail-list.component')
              .then(m => m.MailListComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./features/mail/components/mail-detail/mail-detail.component')
              .then(m => m.MailDetailComponent)
          }
        ]
      },
      {
        path: 'sent',
        loadComponent: () => import('./features/mail/components/mail-list/mail-list.component')
          .then(m => m.MailListComponent),
        data: { folder: 'SENT' }
      },
      {
        path: 'drafts',
        loadComponent: () => import('./features/mail/components/mail-list/mail-list.component')
          .then(m => m.MailListComponent),
        data: { folder: 'DRAFTS' }
      },
      {
        path: 'label/:labelName',
        loadComponent: () => import('./features/mail/components/mail-list/mail-list.component')
          .then(m => m.MailListComponent)
      },
      {
        path: 'compose',
        loadComponent: () => import('./features/mail/components/compose/compose.component')
          .then(m => m.ComposeComponent)
      },
      {
        path: 'contacts',
        loadChildren: () => import('./features/contacts/contacts.module')
          .then(m => m.ContactsModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.module')
          .then(m => m.SettingsModule)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/inbox'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false,
    preloadingStrategy: PreloadAllModules
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

### 3.7 Real-time Updates Strategy

#### WebSocket Service
```typescript
@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket$?: WebSocketSubject<any>;
  private isConnected = false;

  constructor(private authService: AuthService) {}

  connect(endpoint: string): Observable<any> {
    if (!this.socket$ || this.socket$.closed) {
      const token = this.authService.getToken();
      const wsUrl = `${environment.websocketUrl}${endpoint}?token=${token}`;

      this.socket$ = new WebSocketSubject({
        url: wsUrl,
        openObserver: {
          next: () => {
            this.isConnected = true;
            console.log('WebSocket connected');
          }
        },
        closeObserver: {
          next: () => {
            this.isConnected = false;
            console.log('WebSocket disconnected');
          }
        }
      });
    }

    return this.socket$.asObservable().pipe(
      retry({ delay: 5000 }), // Retry connection after 5 seconds
      catchError(error => {
        console.error('WebSocket error:', error);
        return EMPTY;
      })
    );
  }

  send(message: any): void {
    if (this.socket$ && this.isConnected) {
      this.socket$.next(message);
    }
  }

  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.isConnected = false;
    }
  }
}
```

#### Alternative: Polling Strategy
```typescript
@Injectable({
  providedIn: 'root'
})
export class PollingService {
  private pollingInterval = 30000; // 30 seconds
  private polling$ = new Subject<void>();

  constructor(private mailService: MailService) {}

  startPolling(): Observable<ConversationDto[]> {
    return timer(0, this.pollingInterval).pipe(
      switchMap(() => this.mailService.getConversations('INBOX', 0, 50)),
      map(response => response.content),
      shareReplay(1)
    );
  }

  stopPolling(): void {
    this.polling$.next();
    this.polling$.complete();
  }
}
```

---

## 4. Development Roadmap

### Milestone 1: Authentication & Basic Mail View (Weeks 1-2)

#### Week 1: Foundation Setup
- ✅ **Project Setup**
  - Create Angular 20 and Spring Boot 3.5.5 projects
  - Configure PostgreSQL database
  - Set up Apache James email server
  - Implement database migrations

- ✅ **Authentication System**
  - Implement JWT-based authentication
  - Create login/logout functionality
  - Set up IMAP credential validation
  - Implement auth guards and interceptors

#### Week 2: Basic Email Display
- **Backend Tasks**
  - Implement IMAP client manager
  - Create basic MailService with folder listing
  - Implement conversation threading logic
  - Create email metadata caching

- **Frontend Tasks**
  - Create mail layout component
  - Implement basic mail list view
  - Add conversation display
  - Set up routing and navigation

**Deliverables:**
- Users can log in with IMAP credentials
- Basic inbox view showing conversations
- Navigation between folders
- Logout functionality

### Milestone 2: Composing & Sending Emails (Weeks 3-4)

#### Week 3: Email Composition
- **Backend Tasks**
  - Implement SMTP email sending
  - Handle multipart messages
  - Add attachment support
  - Implement reply/forward logic

- **Frontend Tasks**
  - Create rich text compose component
  - Implement Quill editor integration
  - Add attachment handling
  - Create reply/forward workflows

#### Week 4: Email Actions
- **Backend Tasks**
  - Implement bulk email actions
  - Add mark as read/unread functionality
  - Implement delete and archive operations
  - Add draft saving capability

- **Frontend Tasks**
  - Add bulk action toolbar
  - Implement quick reply functionality
  - Add keyboard shortcuts
  - Create confirmation dialogs

**Deliverables:**
- Complete email composition with rich text
- Reply, reply-all, and forward functionality
- Attachment handling (upload/download)
- Basic email actions (read, delete, archive)

### Milestone 3: Conversation Threading & Actions (Weeks 5-6)

#### Week 5: Advanced Threading
- **Backend Tasks**
  - Refine conversation threading algorithm
  - Implement cross-folder conversation search
  - Add conversation metadata caching
  - Optimize IMAP queries for performance

- **Frontend Tasks**
  - Enhance conversation detail view
  - Add conversation expansion/collapse
  - Implement thread navigation
  - Add conversation-level actions

#### Week 6: Email Actions & Labels
- **Backend Tasks**
  - Implement label system
  - Add email-label associations
  - Create label management APIs
  - Implement label-based filtering

- **Frontend Tasks**
  - Create label management interface
  - Add label assignment to emails
  - Implement label-based navigation
  - Create label color coding

**Deliverables:**
- Advanced conversation threading
- Complete label/tag system
- Conversation-level actions
- Label-based email organization

### Milestone 4: Search & Labels (Weeks 7-8)

#### Week 7: Search Implementation
- **Backend Tasks**
  - Implement advanced email search
  - Add search criteria support (from, to, date, etc.)
  - Optimize search performance
  - Add search result highlighting

- **Frontend Tasks**
  - Create advanced search interface
  - Add search filters and date pickers
  - Implement search result display
  - Add search history and suggestions

#### Week 8: Advanced Features
- **Backend Tasks**
  - Implement contact management
  - Add email frequency tracking
  - Create user preferences system
  - Add email signature support

- **Frontend Tasks**
  - Create contact management interface
  - Add user settings/preferences page
  - Implement auto-complete for recipients
  - Add email signature editor

**Deliverables:**
- Powerful search with multiple filters
- Contact management system
- User preferences and settings
- Auto-complete and suggestions

### Milestone 5: UI Polish & Advanced Features (Weeks 9-10)

#### Week 9: Real-time & Performance
- **Backend Tasks**
  - Implement WebSocket notifications
  - Add real-time email updates
  - Optimize database queries
  - Implement caching strategies

- **Frontend Tasks**
  - Add real-time notifications
  - Implement push notifications
  - Add infinite scrolling
  - Optimize bundle size and performance

#### Week 10: Polish & Testing
- **Backend Tasks**
  - Add comprehensive logging
  - Implement error handling
  - Add API rate limiting
  - Create backup/restore functionality

- **Frontend Tasks**
  - Add dark/light theme support
  - Implement keyboard shortcuts
  - Add accessibility features
  - Create comprehensive testing

**Deliverables:**
- Real-time email notifications
- Dark/light theme support
- Keyboard shortcuts and accessibility
- Production-ready performance

### Post-Launch Features (Future Milestones)

#### Advanced Features
- **Email Templates**: Pre-designed email templates
- **Calendar Integration**: Meeting scheduling and invites
- **Advanced Spam Filtering**: ML-based spam detection
- **Multi-Account Support**: Multiple email account management
- **Mobile App**: React Native or Flutter mobile application
- **Offline Support**: PWA with offline capabilities

#### Enterprise Features
- **Admin Dashboard**: User and system management
- **Advanced Security**: 2FA, encryption, audit logs
- **Custom Domains**: Support for custom email domains
- **API Access**: RESTful API for third-party integrations
- **Backup/Restore**: Automated backup and restore
- **Analytics**: Email usage analytics and reporting

This comprehensive development plan provides all the architectural design, code snippets, and implementation details needed to build a modern, Gmail-inspired webmail client with Angular 20 and Spring Boot 3.5.5.