package com.memail.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Arrays;

/**
 * Utility for encrypting and decrypting sensitive data using AES-256
 * Used primarily for storing IMAP passwords securely in the database
 */
@Component
public class EncryptionUtil {

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/ECB/PKCS5Padding";

    @Value("${jwt.secret}")
    private String secret;

    /**
     * Generate a 256-bit AES key from the JWT secret
     */
    private SecretKey getKey() throws Exception {
        // Use SHA-256 to generate a proper 256-bit key from the secret
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] keyBytes = digest.digest(secret.getBytes(StandardCharsets.UTF_8));
        // Use first 32 bytes (256 bits) for AES-256
        byte[] key = Arrays.copyOf(keyBytes, 32);
        return new SecretKeySpec(key, ALGORITHM);
    }

    /**
     * Encrypt a plain text string using AES-256
     *
     * @param plainText The text to encrypt
     * @return Base64 encoded encrypted string
     * @throws Exception if encryption fails
     */
    public String encrypt(String plainText) throws Exception {
        if (plainText == null || plainText.isEmpty()) {
            throw new IllegalArgumentException("Plain text cannot be null or empty");
        }

        SecretKey key = getKey();
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.ENCRYPT_MODE, key);

        byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(encryptedBytes);
    }

    /**
     * Decrypt an encrypted string using AES-256
     *
     * @param encryptedText The Base64 encoded encrypted string
     * @return Decrypted plain text
     * @throws Exception if decryption fails
     */
    public String decrypt(String encryptedText) throws Exception {
        if (encryptedText == null || encryptedText.isEmpty()) {
            throw new IllegalArgumentException("Encrypted text cannot be null or empty");
        }

        SecretKey key = getKey();
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.DECRYPT_MODE, key);

        byte[] decodedBytes = Base64.getDecoder().decode(encryptedText);
        byte[] decryptedBytes = cipher.doFinal(decodedBytes);
        return new String(decryptedBytes, StandardCharsets.UTF_8);
    }

    /**
     * Test method to verify encryption/decryption works correctly
     */
    public boolean testEncryption(String testString) {
        try {
            String encrypted = encrypt(testString);
            String decrypted = decrypt(encrypted);
            return testString.equals(decrypted);
        } catch (Exception e) {
            System.err.println("Encryption test failed: " + e.getMessage());
            return false;
        }
    }
}
