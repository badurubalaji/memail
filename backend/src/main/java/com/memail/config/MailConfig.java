package com.memail.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Mail configuration for secure, centralized SMTP sending
 *
 * This configuration sets up a single JavaMailSender that the application uses
 * to send emails on behalf of all users. The application authenticates with
 * SMTP using its own credentials (from application.properties), eliminating
 * the need to store or transmit individual user passwords.
 */
@Configuration
public class MailConfig {

    @Value("${spring.mail.host}")
    private String host;

    @Value("${spring.mail.port}")
    private int port;

    @Value("${spring.mail.username}")
    private String username;

    @Value("${spring.mail.password}")
    private String password;

    @Value("${spring.mail.properties.mail.smtp.auth:true}")
    private boolean auth;

    @Value("${spring.mail.properties.mail.smtp.starttls.enable:true}")
    private boolean starttlsEnable;

    @Value("${spring.mail.properties.mail.smtp.starttls.required:false}")
    private boolean starttlsRequired;

    @Value("${spring.mail.properties.mail.smtp.connectiontimeout:5000}")
    private int connectionTimeout;

    @Value("${spring.mail.properties.mail.smtp.timeout:3000}")
    private int timeout;

    @Value("${spring.mail.properties.mail.smtp.writetimeout:5000}")
    private int writeTimeout;

    /**
     * Configure JavaMailSender with application's SMTP credentials
     *
     * Security Note: This bean uses the application's own SMTP credentials
     * configured in application.properties. User passwords are never used
     * for SMTP authentication, improving security significantly.
     */
    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();

        // Basic SMTP configuration
        mailSender.setHost(host);
        mailSender.setPort(port);
        mailSender.setUsername(username);
        mailSender.setPassword(password);

        // SMTP Properties for secure communication
        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", auth);
        props.put("mail.smtp.starttls.enable", starttlsEnable);
        props.put("mail.smtp.starttls.required", starttlsRequired);
        props.put("mail.smtp.connectiontimeout", connectionTimeout);
        props.put("mail.smtp.timeout", timeout);
        props.put("mail.smtp.writetimeout", writeTimeout);

        // Additional properties for Apache James compatibility
        props.put("mail.smtp.ssl.trust", "*"); // For development with self-signed certificates
        props.put("mail.smtp.ssl.checkserveridentity", "false"); // For development
        props.put("mail.smtp.auth.plain.disable", "false");
        props.put("mail.smtp.auth.login.disable", "false");

        // Enable debug mode for troubleshooting (can be disabled in production)
        props.put("mail.debug", "true");

        System.out.println("=== MAIL CONFIGURATION INITIALIZED ===");
        System.out.println("SMTP Host: " + host + ":" + port);
        System.out.println("SMTP Username: " + username);
        System.out.println("STARTTLS Enabled: " + starttlsEnable);
        System.out.println("Authentication Required: " + auth);

        return mailSender;
    }
}