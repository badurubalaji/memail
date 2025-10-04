package com.memail.repository;

import com.memail.model.UserCredentials;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserCredentialsRepository extends JpaRepository<UserCredentials, Long> {

    /**
     * Find user credentials by email
     */
    Optional<UserCredentials> findByEmail(String email);

    /**
     * Check if credentials exist for email
     */
    boolean existsByEmail(String email);

    /**
     * Delete credentials by email
     */
    void deleteByEmail(String email);
}
