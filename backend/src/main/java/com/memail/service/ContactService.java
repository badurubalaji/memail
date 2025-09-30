package com.memail.service;

import com.memail.model.Contact;
import com.memail.repository.ContactRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Transactional
public class ContactService {

    @Autowired
    private ContactRepository contactRepository;

    /**
     * Get email suggestions for autocomplete
     */
    public List<String> getEmailSuggestions(String userEmail, String query) {
        return contactRepository.findEmailSuggestions(userEmail, query)
                .stream()
                .limit(10) // Limit to top 10 suggestions
                .collect(Collectors.toList());
    }

    /**
     * Get top frequently contacted emails
     */
    public List<String> getTopContacts(String userEmail, int limit) {
        return contactRepository.findTopContactsByFrequency(userEmail)
                .stream()
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * Record email interaction (sent or received)
     * This method will be called when emails are sent or received to track contacts
     */
    public void recordEmailInteraction(String userEmail, String contactEmail, String contactName) {
        if (contactEmail == null || contactEmail.trim().isEmpty() ||
            contactEmail.equals(userEmail)) {
            return; // Don't record self or empty emails
        }

        contactEmail = contactEmail.trim().toLowerCase();

        Optional<Contact> existingContact = contactRepository.findByUserEmailAndContactEmail(userEmail, contactEmail);

        if (existingContact.isPresent()) {
            // Update existing contact
            Contact contact = existingContact.get();
            contact.incrementFrequency();
            if (contactName != null && !contactName.trim().isEmpty()) {
                contact.setContactName(contactName.trim());
            }
            contactRepository.save(contact);
        } else {
            // Create new contact
            Contact newContact = new Contact(userEmail, contactEmail);
            if (contactName != null && !contactName.trim().isEmpty()) {
                newContact.setContactName(contactName.trim());
            }
            contactRepository.save(newContact);
        }
    }

    /**
     * Record multiple email interactions (for To, Cc, Bcc fields)
     */
    public void recordEmailInteractions(String userEmail, String toEmails, String ccEmails, String bccEmails) {
        Set<String> allEmails = Stream.of(
                parseEmailList(toEmails),
                parseEmailList(ccEmails),
                parseEmailList(bccEmails)
        )
        .flatMap(List::stream)
        .collect(Collectors.toSet());

        for (String email : allEmails) {
            recordEmailInteraction(userEmail, email, null);
        }
    }

    /**
     * Parse comma-separated email list
     */
    private List<String> parseEmailList(String emailList) {
        if (emailList == null || emailList.trim().isEmpty()) {
            return List.of();
        }

        return Stream.of(emailList.split("[,;]"))
                .map(String::trim)
                .filter(email -> !email.isEmpty() && email.contains("@"))
                .collect(Collectors.toList());
    }

    /**
     * Get all contacts for a user
     */
    public List<Contact> getAllContacts(String userEmail) {
        return contactRepository.findByUserEmailOrderByFrequencyDescLastContactedDesc(userEmail);
    }

    /**
     * Search contacts
     */
    public List<Contact> searchContacts(String userEmail, String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllContacts(userEmail);
        }
        return contactRepository.findContactsByQuery(userEmail, query.trim());
    }
}