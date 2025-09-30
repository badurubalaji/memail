package com.memail.repository;

import com.memail.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    Optional<RefreshToken> findByTokenAndRevoked(String token, boolean revoked);

    List<RefreshToken> findByUserEmailAndRevoked(String userEmail, boolean revoked);

    List<RefreshToken> findByUserEmail(String userEmail);

    @Modifying
    @Transactional
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.userEmail = :userEmail")
    void revokeAllByUserEmail(@Param("userEmail") String userEmail);

    @Modifying
    @Transactional
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.token = :token")
    void revokeByToken(@Param("token") String token);

    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiryDate < :now")
    void deleteExpiredTokens(@Param("now") LocalDateTime now);

    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken rt WHERE rt.userEmail = :userEmail")
    void deleteAllByUserEmail(@Param("userEmail") String userEmail);

    @Query("SELECT COUNT(rt) FROM RefreshToken rt WHERE rt.userEmail = :userEmail AND rt.revoked = false AND rt.expiryDate > :now")
    long countActiveTokensByUserEmail(@Param("userEmail") String userEmail, @Param("now") LocalDateTime now);
}