package com.memail.controller;

import com.memail.model.Contact;
import com.memail.service.ContactService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/contacts")
@CrossOrigin
public class ContactController {

    @Autowired
    private ContactService contactService;

    /**
     * Get all contacts for the authenticated user
     */
    @GetMapping
    public ResponseEntity<?> getAllContacts(Authentication authentication) {
        try {
            String userEmail = (String) authentication.getPrincipal();
            List<Contact> contacts = contactService.getAllContacts(userEmail);

            return ResponseEntity.ok(Map.of(
                "contacts", contacts,
                "total", contacts.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to fetch contacts",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Search contacts
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchContacts(
            @RequestParam(value = "query", required = false) String query,
            Authentication authentication) {
        try {
            String userEmail = (String) authentication.getPrincipal();
            List<Contact> contacts = contactService.searchContacts(userEmail, query);

            return ResponseEntity.ok(Map.of(
                "contacts", contacts,
                "total", contacts.size(),
                "query", query
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to search contacts",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Get top frequently contacted emails
     */
    @GetMapping("/top")
    public ResponseEntity<?> getTopContacts(
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            Authentication authentication) {
        try {
            String userEmail = (String) authentication.getPrincipal();
            List<String> topEmails = contactService.getTopContacts(userEmail, limit);

            return ResponseEntity.ok(Map.of(
                "emails", topEmails,
                "limit", limit
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to fetch top contacts",
                    "message", e.getMessage()
                ));
        }
    }

    /**
     * Manually add a contact (for testing or manual entry)
     */
    @PostMapping
    public ResponseEntity<?> addContact(
            @RequestParam("email") String contactEmail,
            @RequestParam(value = "name", required = false) String contactName,
            Authentication authentication) {
        try {
            String userEmail = (String) authentication.getPrincipal();
            contactService.recordEmailInteraction(userEmail, contactEmail, contactName);

            return ResponseEntity.ok(Map.of(
                "message", "Contact added successfully",
                "contactEmail", contactEmail
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of(
                    "error", "Failed to add contact",
                    "message", e.getMessage()
                ));
        }
    }
}