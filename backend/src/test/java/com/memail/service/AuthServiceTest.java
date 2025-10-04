package com.memail.service;

import com.memail.dto.LoginRequest;
import com.memail.dto.LoginResponse;
import com.memail.model.RefreshToken;
import com.memail.model.UserCredentials;
import com.memail.repository.RefreshTokenRepository;
import com.memail.repository.UserCredentialsRepository;
import com.memail.security.JwtTokenProvider;
import com.memail.util.EncryptionUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.BadCredentialsException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("AuthService Test Suite")
class AuthServiceTest {

    @Mock
    private MailService mailService;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private UserCredentialsRepository userCredentialsRepository;

    @Mock
    private EncryptionUtil encryptionUtil;

    @InjectMocks
    private AuthService authService;

    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_PASSWORD = "password123";
    private static final String TEST_ACCESS_TOKEN = "access-token-123";
    private static final String TEST_REFRESH_TOKEN = "refresh-token-123";
    private static final String ENCRYPTED_PASSWORD = "encrypted-password";

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("login() - Should successfully authenticate user and return tokens")
    void testLogin_Success() throws Exception {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(TEST_EMAIL);
        loginRequest.setPassword(TEST_PASSWORD);

        when(mailService.authenticateUser(TEST_EMAIL, TEST_PASSWORD)).thenReturn(true);
        when(encryptionUtil.encrypt(TEST_PASSWORD)).thenReturn(ENCRYPTED_PASSWORD);
        when(userCredentialsRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.empty());
        when(jwtTokenProvider.generateAccessToken(TEST_EMAIL)).thenReturn(TEST_ACCESS_TOKEN);
        when(jwtTokenProvider.generateRefreshToken()).thenReturn(TEST_REFRESH_TOKEN);
        when(jwtTokenProvider.getRefreshTokenExpirationTime()).thenReturn(2592000000L); // 30 days

        // Act
        LoginResponse response = authService.login(loginRequest);

        // Assert
        assertNotNull(response);
        assertEquals(TEST_ACCESS_TOKEN, response.getToken());
        assertEquals(TEST_REFRESH_TOKEN, response.getRefreshToken());
        assertEquals(TEST_EMAIL, response.getEmail());
        assertEquals("Login successful", response.getMessage());

        verify(mailService).authenticateUser(TEST_EMAIL, TEST_PASSWORD);
        verify(userCredentialsRepository).save(any(UserCredentials.class));
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    @DisplayName("login() - Should update existing credentials on successful login")
    void testLogin_UpdateExistingCredentials() throws Exception {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(TEST_EMAIL);
        loginRequest.setPassword(TEST_PASSWORD);

        UserCredentials existingCreds = new UserCredentials(TEST_EMAIL, "old-encrypted-password");

        when(mailService.authenticateUser(TEST_EMAIL, TEST_PASSWORD)).thenReturn(true);
        when(encryptionUtil.encrypt(TEST_PASSWORD)).thenReturn(ENCRYPTED_PASSWORD);
        when(userCredentialsRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(existingCreds));
        when(jwtTokenProvider.generateAccessToken(TEST_EMAIL)).thenReturn(TEST_ACCESS_TOKEN);
        when(jwtTokenProvider.generateRefreshToken()).thenReturn(TEST_REFRESH_TOKEN);
        when(jwtTokenProvider.getRefreshTokenExpirationTime()).thenReturn(2592000000L);

        // Act
        LoginResponse response = authService.login(loginRequest);

        // Assert
        assertNotNull(response);
        assertEquals(TEST_ACCESS_TOKEN, response.getToken());
        verify(userCredentialsRepository).save(argThat(creds ->
            creds.getEmail().equals(TEST_EMAIL) &&
            creds.getEncryptedPassword().equals(ENCRYPTED_PASSWORD)
        ));
    }

    @Test
    @DisplayName("login() - Should throw BadCredentialsException on invalid credentials")
    void testLogin_InvalidCredentials() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(TEST_EMAIL);
        loginRequest.setPassword("wrong-password");

        when(mailService.authenticateUser(TEST_EMAIL, "wrong-password")).thenReturn(false);

        // Act & Assert
        assertThrows(BadCredentialsException.class, () -> authService.login(loginRequest));
        verify(mailService).authenticateUser(TEST_EMAIL, "wrong-password");
        verify(jwtTokenProvider, never()).generateAccessToken(anyString());
    }

    @Test
    @DisplayName("login() - Should handle encryption failure gracefully")
    void testLogin_EncryptionFailure() throws Exception {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(TEST_EMAIL);
        loginRequest.setPassword(TEST_PASSWORD);

        when(mailService.authenticateUser(TEST_EMAIL, TEST_PASSWORD)).thenReturn(true);
        when(encryptionUtil.encrypt(TEST_PASSWORD)).thenThrow(new RuntimeException("Encryption failed"));
        when(jwtTokenProvider.generateAccessToken(TEST_EMAIL)).thenReturn(TEST_ACCESS_TOKEN);
        when(jwtTokenProvider.generateRefreshToken()).thenReturn(TEST_REFRESH_TOKEN);
        when(jwtTokenProvider.getRefreshTokenExpirationTime()).thenReturn(2592000000L);

        // Act
        LoginResponse response = authService.login(loginRequest);

        // Assert
        assertNotNull(response);
        assertEquals(TEST_ACCESS_TOKEN, response.getToken());
        // Login should succeed even if credential storage fails
    }

    @Test
    @DisplayName("login() - Should accept device info parameter")
    void testLogin_WithDeviceInfo() throws Exception {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(TEST_EMAIL);
        loginRequest.setPassword(TEST_PASSWORD);
        String deviceInfo = "Chrome on Windows";

        when(mailService.authenticateUser(TEST_EMAIL, TEST_PASSWORD)).thenReturn(true);
        when(encryptionUtil.encrypt(TEST_PASSWORD)).thenReturn(ENCRYPTED_PASSWORD);
        when(userCredentialsRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.empty());
        when(jwtTokenProvider.generateAccessToken(TEST_EMAIL)).thenReturn(TEST_ACCESS_TOKEN);
        when(jwtTokenProvider.generateRefreshToken()).thenReturn(TEST_REFRESH_TOKEN);
        when(jwtTokenProvider.getRefreshTokenExpirationTime()).thenReturn(2592000000L);

        // Act
        LoginResponse response = authService.login(loginRequest, deviceInfo);

        // Assert
        assertNotNull(response);
        verify(refreshTokenRepository).save(argThat(token ->
            token.getDeviceInfo().equals(deviceInfo)
        ));
    }

    @Test
    @DisplayName("logout() - Should close IMAP connection")
    void testLogout() {
        // Arrange
        doNothing().when(mailService).closeConnection(TEST_EMAIL);

        // Act
        authService.logout(TEST_EMAIL);

        // Assert
        verify(mailService).closeConnection(TEST_EMAIL);
    }

    @Test
    @DisplayName("validateToken() - Should validate JWT token")
    void testValidateToken() {
        // Arrange
        when(jwtTokenProvider.validateToken(TEST_ACCESS_TOKEN)).thenReturn(true);

        // Act
        boolean result = authService.validateToken(TEST_ACCESS_TOKEN);

        // Assert
        assertTrue(result);
        verify(jwtTokenProvider).validateToken(TEST_ACCESS_TOKEN);
    }

    @Test
    @DisplayName("getEmailFromToken() - Should extract email from JWT token")
    void testGetEmailFromToken() {
        // Arrange
        when(jwtTokenProvider.getEmailFromToken(TEST_ACCESS_TOKEN)).thenReturn(TEST_EMAIL);

        // Act
        String email = authService.getEmailFromToken(TEST_ACCESS_TOKEN);

        // Assert
        assertEquals(TEST_EMAIL, email);
        verify(jwtTokenProvider).getEmailFromToken(TEST_ACCESS_TOKEN);
    }

    @Test
    @DisplayName("refreshToken() - Should generate new tokens with valid refresh token")
    void testRefreshToken_Success() {
        // Arrange
        RefreshToken refreshToken = new RefreshToken(
            TEST_REFRESH_TOKEN,
            TEST_EMAIL,
            LocalDateTime.now().plusDays(30),
            "device-info"
        );

        String newAccessToken = "new-access-token";
        String newRefreshToken = "new-refresh-token";

        when(refreshTokenRepository.findByTokenAndRevoked(TEST_REFRESH_TOKEN, false))
            .thenReturn(Optional.of(refreshToken));
        when(jwtTokenProvider.generateAccessToken(TEST_EMAIL)).thenReturn(newAccessToken);
        when(jwtTokenProvider.generateRefreshToken()).thenReturn(newRefreshToken);
        when(jwtTokenProvider.getRefreshTokenExpirationTime()).thenReturn(2592000000L);

        // Act
        LoginResponse response = authService.refreshToken(TEST_REFRESH_TOKEN);

        // Assert
        assertNotNull(response);
        assertEquals(newAccessToken, response.getToken());
        assertEquals(newRefreshToken, response.getRefreshToken());
        assertEquals(TEST_EMAIL, response.getEmail());
        assertEquals("Token refreshed successfully", response.getMessage());

        verify(refreshTokenRepository).save(argThat(token -> token.isRevoked()));
        verify(refreshTokenRepository).save(argThat(token -> !token.isRevoked() && token.getToken().equals(newRefreshToken)));
    }

    @Test
    @DisplayName("refreshToken() - Should throw exception for invalid refresh token")
    void testRefreshToken_InvalidToken() {
        // Arrange
        when(refreshTokenRepository.findByTokenAndRevoked(TEST_REFRESH_TOKEN, false))
            .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(BadCredentialsException.class, () ->
            authService.refreshToken(TEST_REFRESH_TOKEN)
        );
    }

    @Test
    @DisplayName("refreshToken() - Should throw exception for expired refresh token")
    void testRefreshToken_ExpiredToken() {
        // Arrange
        RefreshToken expiredToken = new RefreshToken(
            TEST_REFRESH_TOKEN,
            TEST_EMAIL,
            LocalDateTime.now().minusDays(1), // Expired
            "device-info"
        );

        when(refreshTokenRepository.findByTokenAndRevoked(TEST_REFRESH_TOKEN, false))
            .thenReturn(Optional.of(expiredToken));

        // Act & Assert
        assertThrows(BadCredentialsException.class, () ->
            authService.refreshToken(TEST_REFRESH_TOKEN)
        );
    }

    @Test
    @DisplayName("revokeRefreshToken() - Should revoke specific refresh token")
    void testRevokeRefreshToken() {
        // Arrange
        doNothing().when(refreshTokenRepository).revokeByToken(TEST_REFRESH_TOKEN);

        // Act
        authService.revokeRefreshToken(TEST_REFRESH_TOKEN);

        // Assert
        verify(refreshTokenRepository).revokeByToken(TEST_REFRESH_TOKEN);
    }

    @Test
    @DisplayName("revokeAllRefreshTokens() - Should revoke all tokens for user")
    void testRevokeAllRefreshTokens() {
        // Arrange
        doNothing().when(refreshTokenRepository).revokeAllByUserEmail(TEST_EMAIL);

        // Act
        authService.revokeAllRefreshTokens(TEST_EMAIL);

        // Assert
        verify(refreshTokenRepository).revokeAllByUserEmail(TEST_EMAIL);
    }

    @Test
    @DisplayName("cleanupExpiredTokens() - Should delete expired tokens")
    void testCleanupExpiredTokens() {
        // Arrange
        doNothing().when(refreshTokenRepository).deleteExpiredTokens(any(LocalDateTime.class));

        // Act
        authService.cleanupExpiredTokens(TEST_EMAIL);

        // Assert
        verify(refreshTokenRepository).deleteExpiredTokens(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("isTokenAboutToExpire() - Should check if token is about to expire")
    void testIsTokenAboutToExpire() {
        // Arrange
        when(jwtTokenProvider.isTokenAboutToExpire(TEST_ACCESS_TOKEN)).thenReturn(true);

        // Act
        boolean result = authService.isTokenAboutToExpire(TEST_ACCESS_TOKEN);

        // Assert
        assertTrue(result);
        verify(jwtTokenProvider).isTokenAboutToExpire(TEST_ACCESS_TOKEN);
    }
}
