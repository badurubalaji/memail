package com.memail.controller;

import com.memail.dto.*;
import com.ashulabs.memail.dto.DraftEmailDTO;
import com.ashulabs.memail.dto.ReplyRequestDTO;
import com.memail.service.MailService;
import com.memail.service.ContactService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

import jakarta.mail.MessagingException;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("EmailController Test Suite")
class EmailControllerTest {

    @Mock
    private MailService mailService;

    @Mock
    private ContactService contactService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private EmailController emailController;

    private static final String TEST_EMAIL = "test@example.com";

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(authentication.getPrincipal()).thenReturn(TEST_EMAIL);
    }

    @Test
    @DisplayName("GET /emails - Should return emails successfully")
    void testGetEmails_Success() {
        // Arrange
        EmailListResponse expectedResponse = new EmailListResponse();
        when(mailService.getEmails(TEST_EMAIL, "INBOX", 0, 50)).thenReturn(expectedResponse);

        // Act
        ResponseEntity<?> response = emailController.getEmails("INBOX", 0, 50, authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedResponse, response.getBody());
        verify(mailService).getEmails(TEST_EMAIL, "INBOX", 0, 50);
    }

    @Test
    @DisplayName("GET /emails - Should handle exceptions")
    void testGetEmails_Exception() {
        // Arrange
        when(mailService.getEmails(anyString(), anyString(), anyInt(), anyInt()))
            .thenThrow(new RuntimeException("Service error"));

        // Act
        ResponseEntity<?> response = emailController.getEmails("INBOX", 0, 50, authentication);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
    }

    @Test
    @DisplayName("GET /emails/folders - Should return default folders")
    @SuppressWarnings("unchecked")
    void testGetFolders_Success() {
        // Arrange
        doNothing().when(mailService).initializeDefaultFolders(TEST_EMAIL);

        // Act
        ResponseEntity<?> response = emailController.getFolders(authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        String[] folders = (String[]) body.get("folders");
        assertEquals(7, folders.length);
        verify(mailService).initializeDefaultFolders(TEST_EMAIL);
    }

    @Test
    @DisplayName("GET /emails/health - Should return health status")
    @SuppressWarnings("unchecked")
    void testHealthCheck() {
        // Act
        ResponseEntity<?> response = emailController.health(authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertEquals("OK", body.get("status"));
        assertEquals(TEST_EMAIL, body.get("user"));
    }

    @Test
    @DisplayName("GET /emails/suggestions - Should return email suggestions")
    @SuppressWarnings("unchecked")
    void testGetEmailSuggestions_Success() {
        // Arrange
        List<String> suggestions = Arrays.asList("user1@example.com", "user2@example.com");
        when(contactService.getEmailSuggestions(TEST_EMAIL, "user")).thenReturn(suggestions);

        // Act
        ResponseEntity<?> response = emailController.getEmailSuggestions("user", authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertEquals(suggestions, body.get("suggestions"));
    }

    @Test
    @DisplayName("GET /emails/search - Should return search results")
    void testSearchEmails_Success() {
        // Arrange
        EmailListResponse expectedResponse = new EmailListResponse();
        when(mailService.searchEmails(TEST_EMAIL, "test query", "INBOX", 0, 50))
            .thenReturn(expectedResponse);

        // Act
        ResponseEntity<?> response = emailController.searchEmails("test query", "INBOX", 0, 50, authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedResponse, response.getBody());
    }

    @Test
    @DisplayName("POST /emails/send - Should send email successfully")
    @SuppressWarnings("unchecked")
    void testSendEmail_Success() throws MessagingException {
        // Arrange
        String to = "recipient@example.com";
        String subject = "Test Subject";
        String htmlContent = "<p>Test content</p>";

        doNothing().when(mailService).sendEmail(eq(TEST_EMAIL), any(SendEmailRequestDTO.class));
        doNothing().when(contactService).recordEmailInteractions(anyString(), anyString(), any(), any());

        // Act
        ResponseEntity<?> response = emailController.sendEmail(to, null, null, subject, htmlContent, null, authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("Email sent successfully", body.get("message"));
        verify(mailService).sendEmail(eq(TEST_EMAIL), any(SendEmailRequestDTO.class));
    }

    @Test
    @DisplayName("POST /emails/send - Should send email with attachments")
    void testSendEmail_WithAttachments() throws MessagingException {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
            "attachment",
            "test.txt",
            "text/plain",
            "Test content".getBytes()
        );
        MultipartFile[] attachments = new MultipartFile[]{file};

        doNothing().when(mailService).sendEmail(eq(TEST_EMAIL), any(SendEmailRequestDTO.class));
        doNothing().when(contactService).recordEmailInteractions(anyString(), anyString(), any(), any());

        // Act
        ResponseEntity<?> response = emailController.sendEmail(
            "recipient@example.com",
            null,
            null,
            "Subject",
            "Content",
            attachments,
            authentication
        );

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(mailService).sendEmail(eq(TEST_EMAIL), argThat(dto ->
            dto.getAttachments() != null && dto.getAttachments().size() == 1
        ));
    }

    @Test
    @DisplayName("POST /emails/send - Should handle send failure")
    void testSendEmail_Failure() throws MessagingException {
        // Arrange
        doThrow(new RuntimeException("Send failed"))
            .when(mailService).sendEmail(anyString(), any(SendEmailRequestDTO.class));

        // Act
        ResponseEntity<?> response = emailController.sendEmail(
            "recipient@example.com",
            null,
            null,
            "Subject",
            "Content",
            null,
            authentication
        );

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    @DisplayName("GET /emails/conversations - Should return conversations")
    void testGetConversations_Success() {
        // Arrange
        ConversationListResponse expectedResponse = new ConversationListResponse();
        when(mailService.getConversations(TEST_EMAIL, "INBOX", 0, 50))
            .thenReturn(expectedResponse);

        // Act
        ResponseEntity<?> response = emailController.getConversations("INBOX", 0, 50, authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedResponse, response.getBody());
    }

    @Test
    @DisplayName("GET /emails/conversations/{threadId} - Should return conversation thread")
    void testGetConversationThread_Success() {
        // Arrange
        String threadId = "thread-123";
        ConversationDTO expectedConversation = new ConversationDTO();
        when(mailService.getConversationThread(TEST_EMAIL, threadId))
            .thenReturn(expectedConversation);

        // Act
        ResponseEntity<?> response = emailController.getConversationThread(threadId, authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedConversation, response.getBody());
    }

    @Test
    @DisplayName("POST /emails/draft - Should save draft successfully")
    @SuppressWarnings("unchecked")
    void testSaveDraft_Success() throws MessagingException {
        // Arrange
        doNothing().when(mailService).saveDraft(eq(TEST_EMAIL), any(SendEmailRequestDTO.class));

        // Act
        ResponseEntity<?> response = emailController.saveDraft(
            "recipient@example.com",
            null,
            null,
            "Draft Subject",
            "Draft Content",
            null,
            authentication
        );

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("Draft saved successfully", body.get("message"));
    }

    @Test
    @DisplayName("POST /emails/actions - Should perform email action")
    @SuppressWarnings("unchecked")
    void testPerformEmailActions_Success() {
        // Arrange
        EmailActionRequest request = new EmailActionRequest();
        request.setMessageIds(Arrays.asList("msg1", "msg2"));
        request.setAction(EmailActionRequest.EmailAction.MARK_AS_READ);

        doNothing().when(mailService).performEmailActions(TEST_EMAIL, request);

        // Act
        ResponseEntity<?> response = emailController.performEmailActions(request, authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("Action performed successfully", body.get("message"));
        verify(mailService).performEmailActions(TEST_EMAIL, request);
    }

    @Test
    @DisplayName("GET /emails/drafts/{messageId} - Should return draft")
    void testGetDraft_Success() {
        // Arrange
        String messageId = "draft-123";
        DraftEmailDTO expectedDraft = new DraftEmailDTO();
        when(mailService.getDraft(TEST_EMAIL, messageId)).thenReturn(expectedDraft);

        // Act
        ResponseEntity<?> response = emailController.getDraft(messageId, authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedDraft, response.getBody());
    }

    @Test
    @DisplayName("PUT /emails/drafts/{messageId} - Should update draft")
    @SuppressWarnings("unchecked")
    void testUpdateDraft_Success() {
        // Arrange
        String messageId = "draft-123";
        DraftEmailDTO draftRequest = new DraftEmailDTO();
        doNothing().when(mailService).updateDraft(TEST_EMAIL, messageId, draftRequest);

        // Act
        ResponseEntity<?> response = emailController.updateDraft(messageId, draftRequest, authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("Draft updated successfully", body.get("message"));
    }

    @Test
    @DisplayName("DELETE /emails/drafts/{messageId} - Should delete draft")
    @SuppressWarnings("unchecked")
    void testDeleteDraft_Success() {
        // Arrange
        String messageId = "draft-123";
        doNothing().when(mailService).deleteDraft(TEST_EMAIL, messageId);

        // Act
        ResponseEntity<?> response = emailController.deleteDraft(messageId, authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("Draft deleted successfully", body.get("message"));
    }

    @Test
    @DisplayName("POST /emails/drafts/bulk-delete - Should delete multiple drafts")
    @SuppressWarnings("unchecked")
    void testBulkDeleteDrafts_Success() {
        // Arrange
        List<String> messageIds = Arrays.asList("draft1", "draft2", "draft3");
        Map<String, Object> request = new HashMap<>();
        request.put("messageIds", messageIds);

        doNothing().when(mailService).bulkDeleteDrafts(TEST_EMAIL, messageIds);

        // Act
        ResponseEntity<?> response = emailController.bulkDeleteDrafts(request, authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("Drafts deleted successfully", body.get("message"));
        assertEquals(3, body.get("count"));
    }

    @Test
    @DisplayName("POST /emails/drafts/bulk-delete - Should handle empty message IDs")
    void testBulkDeleteDrafts_EmptyMessageIds() {
        // Arrange
        Map<String, Object> request = new HashMap<>();
        request.put("messageIds", new ArrayList<>());

        // Act
        ResponseEntity<?> response = emailController.bulkDeleteDrafts(request, authentication);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("POST /emails/reply - Should send reply")
    @SuppressWarnings("unchecked")
    void testSendReply_Success() {
        // Arrange
        ReplyRequestDTO replyRequest = new ReplyRequestDTO();
        replyRequest.setType("reply");
        replyRequest.setTo(Arrays.asList("recipient@example.com"));
        replyRequest.setSubject("Re: Test");
        replyRequest.setHtmlContent("Reply content");
        replyRequest.setOriginalMessageId("msg-123");
        replyRequest.setSaveDraft(false);

        doNothing().when(mailService).sendReply(TEST_EMAIL, replyRequest);
        doNothing().when(contactService).recordEmailInteractions(anyString(), anyString(), any(), any());

        // Act
        ResponseEntity<?> response = emailController.sendReply(replyRequest, authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("Reply sent successfully", body.get("message"));
        verify(mailService).sendReply(TEST_EMAIL, replyRequest);
    }

    @Test
    @DisplayName("POST /emails/reply - Should save reply as draft")
    @SuppressWarnings("unchecked")
    void testSendReply_SaveAsDraft() {
        // Arrange
        ReplyRequestDTO replyRequest = new ReplyRequestDTO();
        replyRequest.setType("reply");
        replyRequest.setTo(Arrays.asList("recipient@example.com"));
        replyRequest.setSubject("Re: Test");
        replyRequest.setHtmlContent("Reply content");
        replyRequest.setOriginalMessageId("msg-123");
        replyRequest.setSaveDraft(true);

        doNothing().when(mailService).saveReplyDraft(TEST_EMAIL, replyRequest);

        // Act
        ResponseEntity<?> response = emailController.sendReply(replyRequest, authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertEquals("Reply saved as draft", body.get("message"));
        verify(mailService).saveReplyDraft(TEST_EMAIL, replyRequest);
    }

    @Test
    @DisplayName("POST /emails/reply - Should handle reply failure")
    void testSendReply_Failure() {
        // Arrange
        ReplyRequestDTO replyRequest = new ReplyRequestDTO();
        replyRequest.setType("reply");
        replyRequest.setSaveDraft(false);

        doThrow(new RuntimeException("Send failed"))
            .when(mailService).sendReply(anyString(), any(ReplyRequestDTO.class));

        // Act
        ResponseEntity<?> response = emailController.sendReply(replyRequest, authentication);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }
}
