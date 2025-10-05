package com.memail.controller;

import com.memail.dto.EmailListResponse;
import com.memail.dto.SendEmailRequestDTO;
import com.memail.dto.FileAttachmentDTO;
import com.memail.dto.ConversationListResponse;
import com.memail.dto.ConversationDTO;
import com.memail.dto.EmailActionRequest;
import com.ashulabs.memail.dto.DraftEmailDTO;
import com.ashulabs.memail.dto.ReplyRequestDTO;
import com.memail.service.MailService;
import com.memail.service.ContactService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/emails")
@CrossOrigin
public class EmailController {

    @Autowired
    private MailService mailService;

    @Autowired
    private ContactService contactService;

    /**
     * Get emails from specified folder with pagination
     */
    @GetMapping
    public ResponseEntity<?> getEmails(
            @RequestParam(defaultValue = "INBOX") String folder,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication authentication) {

        try {
            String email = (String) authentication.getPrincipal();
            EmailListResponse emails = mailService.getEmails(email, folder, page, size);
            return ResponseEntity.ok(emails);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Server error",
                    "message", "Unable to fetch emails: " + e.getMessage()
                ));
        }
    }

    /**
     * Get folders available to the user
     */
    @GetMapping("/folders")
    public ResponseEntity<?> getFolders(Authentication authentication) {
        try {
            String email = (String) authentication.getPrincipal();

            // Initialize default folders if they don't exist
            mailService.initializeDefaultFolders(email);

            // Return all available folders
            return ResponseEntity.ok(Map.of(
                "folders", new String[]{
                    "INBOX",
                    "SENT",
                    "DRAFTS",
                    "TRASH",
                    "STARRED",
                    "IMPORTANT",
                    "SPAM"
                }
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Server error",
                    "message", "Unable to fetch folders: " + e.getMessage()
                ));
        }
    }

    /**
     * Health check endpoint for testing
     */
    @GetMapping("/health")
    public ResponseEntity<?> health(Authentication authentication) {
        String email = (String) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of(
            "status", "OK",
            "user", email,
            "message", "Email service is running"
        ));
    }

    /**
     * Get email suggestions for autocomplete
     */
    @GetMapping("/suggestions")
    public ResponseEntity<?> getEmailSuggestions(
            @RequestParam(value = "query", required = false, defaultValue = "") String query,
            Authentication authentication) {
        try {
            String userEmail = (String) authentication.getPrincipal();
            List<String> suggestions = contactService.getEmailSuggestions(userEmail, query);

            return ResponseEntity.ok(Map.of(
                "suggestions", suggestions
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to fetch email suggestions",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Search emails endpoint
     * GET /api/emails/search?q=from:user@example.com subject:report
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchEmails(
            @RequestParam(value = "q", required = false, defaultValue = "") String query,
            @RequestParam(value = "folder", required = false, defaultValue = "INBOX") String folder,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication authentication) {

        try {
            String email = (String) authentication.getPrincipal();
            EmailListResponse emails = mailService.searchEmails(email, query, folder, page, size);
            return ResponseEntity.ok(emails);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Server error",
                    "message", "Unable to search emails: " + e.getMessage()
                ));
        }
    }

    /**
     * Send email endpoint
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendEmail(
            @RequestParam("to") String to,
            @RequestParam(value = "cc", required = false) String cc,
            @RequestParam(value = "bcc", required = false) String bcc,
            @RequestParam("subject") String subject,
            @RequestParam("htmlContent") String htmlContent,
            @RequestParam(value = "attachments", required = false) MultipartFile[] attachments,
            Authentication authentication) {

        try {
            String username = (String) authentication.getPrincipal();

            // Create the send request DTO
            SendEmailRequestDTO sendRequest = new SendEmailRequestDTO();
            sendRequest.setTo(to);
            sendRequest.setCc(cc);
            sendRequest.setBcc(bcc);
            sendRequest.setSubject(subject);
            sendRequest.setHtmlContent(htmlContent);

            // Process attachments if present
            if (attachments != null && attachments.length > 0) {
                List<FileAttachmentDTO> attachmentList = new ArrayList<>();
                for (MultipartFile file : attachments) {
                    if (!file.isEmpty()) {
                        FileAttachmentDTO attachment = new FileAttachmentDTO();
                        attachment.setFileName(file.getOriginalFilename());
                        attachment.setContentType(file.getContentType());
                        attachment.setContent(file.getBytes());
                        attachmentList.add(attachment);
                    }
                }
                sendRequest.setAttachments(attachmentList);
            }

            // Send the email using the application's secure SMTP credentials
            // The user's email is used as the "From" address, but authentication
            // is handled by the application's centralized credentials
            mailService.sendEmail(username, sendRequest);

            // Record contact interactions for autocomplete suggestions
            try {
                contactService.recordEmailInteractions(username, to, cc, bcc);
            } catch (Exception contactException) {
                // Log but don't fail the send operation
                System.err.println("Failed to record contact interactions: " + contactException.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                "message", "Email sent successfully",
                "to", to,
                "subject", subject
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to send email",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Get conversations from specified folder with pagination
     */
    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations(
            @RequestParam(defaultValue = "INBOX") String folder,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            Authentication authentication) {

        try {
            String email = (String) authentication.getPrincipal();
            ConversationListResponse conversations = mailService.getConversations(email, folder, page, size);
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Server error",
                    "message", "Unable to fetch conversations: " + e.getMessage()
                ));
        }
    }

    /**
     * Get full conversation thread by thread ID
     */
    @GetMapping("/conversations/{threadId}")
    public ResponseEntity<?> getConversationThread(
            @PathVariable String threadId,
            Authentication authentication) {

        try {
            String email = (String) authentication.getPrincipal();
            ConversationDTO conversation = mailService.getConversationThread(email, threadId);
            return ResponseEntity.ok(conversation);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Server error",
                    "message", "Unable to fetch conversation: " + e.getMessage()
                ));
        }
    }

    /**
     * Save draft email endpoint
     */
    @PostMapping("/draft")
    public ResponseEntity<?> saveDraft(
            @RequestParam("to") String to,
            @RequestParam(value = "cc", required = false) String cc,
            @RequestParam(value = "bcc", required = false) String bcc,
            @RequestParam("subject") String subject,
            @RequestParam("htmlContent") String htmlContent,
            @RequestParam(value = "attachments", required = false) MultipartFile[] attachments,
            Authentication authentication) {

        try {
            String username = (String) authentication.getPrincipal();

            // Create the draft request DTO (reuse SendEmailRequestDTO)
            SendEmailRequestDTO draftRequest = new SendEmailRequestDTO();
            draftRequest.setTo(to);
            draftRequest.setCc(cc);
            draftRequest.setBcc(bcc);
            draftRequest.setSubject(subject);
            draftRequest.setHtmlContent(htmlContent);

            // Process attachments if present
            if (attachments != null && attachments.length > 0) {
                List<FileAttachmentDTO> attachmentList = new ArrayList<>();
                for (MultipartFile file : attachments) {
                    if (!file.isEmpty()) {
                        FileAttachmentDTO attachment = new FileAttachmentDTO();
                        attachment.setFileName(file.getOriginalFilename());
                        attachment.setContentType(file.getContentType());
                        attachment.setContent(file.getBytes());
                        attachmentList.add(attachment);
                    }
                }
                draftRequest.setAttachments(attachmentList);
            }

            // Save the draft and get the message ID
            String messageId = mailService.saveDraft(username, draftRequest);

            return ResponseEntity.ok(Map.of(
                "message", "Draft saved successfully",
                "messageId", messageId != null ? messageId : "",
                "to", to,
                "subject", subject
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to save draft",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Perform actions on emails (mark as read, delete, archive)
     */
    @PostMapping("/actions")
    public ResponseEntity<?> performEmailActions(
            @RequestBody EmailActionRequest request,
            Authentication authentication) {

        try {
            String email = (String) authentication.getPrincipal();
            mailService.performEmailActions(email, request);

            return ResponseEntity.ok(Map.of(
                "message", "Action performed successfully",
                "action", request.getAction().toString(),
                "messageCount", request.getMessageIds().size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Server error",
                    "message", "Unable to perform action: " + e.getMessage()
                ));
        }
    }

    /**
     * Get draft email details for editing
     */
    @GetMapping("/drafts/{messageId}")
    public ResponseEntity<?> getDraft(
            @PathVariable String messageId,
            Authentication authentication) {

        try {
            String email = (String) authentication.getPrincipal();
            DraftEmailDTO draft = mailService.getDraft(email, messageId);
            return ResponseEntity.ok(draft);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Server error",
                    "message", "Unable to fetch draft: " + e.getMessage()
                ));
        }
    }

    /**
     * Update existing draft
     */
    @PutMapping("/drafts/{messageId}")
    public ResponseEntity<?> updateDraft(
            @PathVariable String messageId,
            @RequestBody DraftEmailDTO draftRequest,
            Authentication authentication) {

        try {
            String email = (String) authentication.getPrincipal();
            mailService.updateDraft(email, messageId, draftRequest);

            return ResponseEntity.ok(Map.of(
                "message", "Draft updated successfully",
                "messageId", messageId
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to update draft",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Delete draft
     */
    @DeleteMapping("/drafts/{messageId}")
    public ResponseEntity<?> deleteDraft(
            @PathVariable String messageId,
            Authentication authentication) {

        try {
            String email = (String) authentication.getPrincipal();
            mailService.deleteDraft(email, messageId);

            return ResponseEntity.ok(Map.of(
                "message", "Draft deleted successfully",
                "messageId", messageId
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to delete draft",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Bulk delete drafts
     */
    @PostMapping("/drafts/bulk-delete")
    public ResponseEntity<?> bulkDeleteDrafts(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        try {
            String email = (String) authentication.getPrincipal();
            @SuppressWarnings("unchecked")
            List<String> messageIds = (List<String>) request.get("messageIds");

            if (messageIds == null || messageIds.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "No message IDs provided"));
            }

            mailService.bulkDeleteDrafts(email, messageIds);

            return ResponseEntity.ok(Map.of(
                "message", "Drafts deleted successfully",
                "count", messageIds.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to delete drafts",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Send reply or forward email
     */
    @PostMapping("/reply")
    public ResponseEntity<?> sendReply(
            @RequestBody ReplyRequestDTO request,
            Authentication authentication) {

        try {
            String email = (String) authentication.getPrincipal();

            if (request.isSaveDraft()) {
                // Save as draft instead of sending
                mailService.saveReplyDraft(email, request);
                return ResponseEntity.ok(Map.of(
                    "message", "Reply saved as draft",
                    "type", request.getType()
                ));
            } else {
                // Send the reply/forward
                mailService.sendReply(email, request);

                // Record contact interactions for autocomplete suggestions
                try {
                    List<String> allRecipients = new ArrayList<>();
                    if (request.getTo() != null) allRecipients.addAll(request.getTo());
                    if (request.getCc() != null) allRecipients.addAll(request.getCc());
                    if (request.getBcc() != null) allRecipients.addAll(request.getBcc());

                    contactService.recordEmailInteractions(
                        email,
                        String.join(",", allRecipients),
                        null,
                        null
                    );
                } catch (Exception contactException) {
                    // Log but don't fail the send operation
                    System.err.println("Failed to record contact interactions: " + contactException.getMessage());
                }

                return ResponseEntity.ok(Map.of(
                    "message", "Reply sent successfully",
                    "type", request.getType(),
                    "subject", request.getSubject()
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to process reply",
                    "message", e.getMessage()
                ));
        }
    }
}