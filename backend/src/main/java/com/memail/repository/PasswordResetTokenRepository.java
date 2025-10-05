package com.memail.repository;

import com.memail.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository for PasswordResetToken
 */
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    /**
     * Find valid (unused and not expired) token
     */
    Optional<PasswordResetToken> findByTokenAndUsed(String token, Boolean used);

    /**
     * Find token by user email
     */
    Optional<PasswordResetToken> findByUserEmail(String userEmail);

    /**
     * Delete expired tokens
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiryDate < :now")
    void deleteExpiredTokens(LocalDateTime now);

    /**
     * Delete all tokens for a user
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.userEmail = :email")
    void deleteByUserEmail(String email);
}
