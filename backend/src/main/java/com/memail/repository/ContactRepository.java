package com.memail.repository;

import com.memail.model.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    /**
     * Find contact by user email and contact email
     */
    Optional<Contact> findByUserEmailAndContactEmail(String userEmail, String contactEmail);

    /**
     * Get email suggestions for autocomplete based on frequency and recent usage
     * Returns contacts ordered by frequency (descending) and last contacted (descending)
     */
    @Query("SELECT c.contactEmail FROM Contact c WHERE c.userEmail = :userEmail " +
           "AND (:query IS NULL OR :query = '' OR LOWER(c.contactEmail) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(c.contactName) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY c.frequency DESC, c.lastContacted DESC")
    List<String> findEmailSuggestions(@Param("userEmail") String userEmail,
                                    @Param("query") String query);

    /**
     * Get top N most frequently contacted emails
     */
    @Query("SELECT c.contactEmail FROM Contact c WHERE c.userEmail = :userEmail " +
           "ORDER BY c.frequency DESC, c.lastContacted DESC")
    List<String> findTopContactsByFrequency(@Param("userEmail") String userEmail);

    /**
     * Get all contacts for a user
     */
    List<Contact> findByUserEmailOrderByFrequencyDescLastContactedDesc(String userEmail);

    /**
     * Get contacts that match a query string
     */
    @Query("SELECT c FROM Contact c WHERE c.userEmail = :userEmail " +
           "AND (LOWER(c.contactEmail) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(c.contactName) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY c.frequency DESC, c.lastContacted DESC")
    List<Contact> findContactsByQuery(@Param("userEmail") String userEmail,
                                    @Param("query") String query);
}