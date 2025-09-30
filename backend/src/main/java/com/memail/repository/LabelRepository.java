package com.memail.repository;

import com.memail.model.Label;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LabelRepository extends JpaRepository<Label, Long> {

    /**
     * Find all labels for a specific user
     */
    List<Label> findByUserIdOrderByNameAsc(String userId);

    /**
     * Find a label by user ID and label name
     */
    Optional<Label> findByUserIdAndName(String userId, String name);

    /**
     * Check if a label with the given name exists for the user
     */
    boolean existsByUserIdAndName(String userId, String name);

    /**
     * Find a label by user ID and label ID
     */
    Optional<Label> findByUserIdAndId(String userId, Long id);

    /**
     * Delete all labels for a specific user
     */
    void deleteByUserId(String userId);
}