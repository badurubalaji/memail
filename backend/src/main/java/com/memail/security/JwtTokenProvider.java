package com.memail.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.SecretKey;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private int jwtExpirationInMs;

    @Value("${jwt.refresh-expiration:2592000000}") // 30 days default
    private long refreshTokenExpirationInMs;

    /**
     * Get the signing key for JWT operations.
     * Supports both base64-encoded and plain text secrets.
     *
     * @return SecretKey for JWT signing/verification
     */
    private SecretKey getSigningKey() {
        try {
            // Try to decode as base64 first
            byte[] decodedKey = Base64.getDecoder().decode(jwtSecret);
            return Keys.hmacShaKeyFor(decodedKey);
        } catch (IllegalArgumentException e) {
            // If base64 decoding fails, treat as plain text
            logger.warn("JWT secret is not base64 encoded, using as plain text. Consider using base64 encoding for production.");
            return Keys.hmacShaKeyFor(jwtSecret.getBytes());
        }
    }

    public String generateToken(String email) {
        Date expiryDate = new Date(System.currentTimeMillis() + jwtExpirationInMs);

        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    /**
     * Validate JWT token
     *
     * @param authToken JWT token to validate
     * @return true if token is valid, false otherwise
     */
    public boolean validateToken(String authToken) {
        try {
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(authToken);
            logger.debug("JWT token validation successful");
            return true;
        } catch (ExpiredJwtException e) {
            logger.debug("JWT token is expired: {}", e.getMessage());
            return false;
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
            return false;
        } catch (MalformedJwtException e) {
            logger.error("JWT token is malformed: {}", e.getMessage());
            return false;
        } catch (io.jsonwebtoken.security.SignatureException e) {
            logger.error("JWT signature validation failed: {}", e.getMessage());
            return false;
        } catch (IllegalArgumentException e) {
            logger.error("JWT token compact of handler are invalid: {}", e.getMessage());
            return false;
        } catch (JwtException e) {
            logger.error("JWT validation error: {}", e.getMessage());
            return false;
        }
    }

    public Date getExpirationDateFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getExpiration();
    }

    public boolean isTokenExpired(String token) {
        Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }

    /**
     * Generate a secure refresh token
     */
    public String generateRefreshToken() {
        SecureRandom secureRandom = new SecureRandom();
        byte[] tokenBytes = new byte[64]; // 512-bit token
        secureRandom.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    /**
     * Get refresh token expiration time in milliseconds
     */
    public long getRefreshTokenExpirationTime() {
        return refreshTokenExpirationInMs;
    }

    /**
     * Generate JWT with custom expiration time
     */
    public String generateTokenWithExpiration(String email, long expirationInMs) {
        Date expiryDate = new Date(System.currentTimeMillis() + expirationInMs);

        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Generate a short-lived access token (15 minutes)
     */
    public String generateAccessToken(String email) {
        long accessTokenExpiration = 15 * 60 * 1000; // 15 minutes
        return generateTokenWithExpiration(email, accessTokenExpiration);
    }

    /**
     * Get token type from JWT claims
     */
    public String getTokenType(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return claims.get("type", String.class);
        } catch (Exception e) {
            logger.debug("Could not get token type: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Check if token is about to expire (within next 5 minutes)
     */
    public boolean isTokenAboutToExpire(String token) {
        try {
            Date expiration = getExpirationDateFromToken(token);
            long timeUntilExpiration = expiration.getTime() - System.currentTimeMillis();
            return timeUntilExpiration < (5 * 60 * 1000); // 5 minutes
        } catch (Exception e) {
            logger.debug("Could not check token expiration: {}", e.getMessage());
            return true; // If we can't determine, assume it's about to expire
        }
    }
}