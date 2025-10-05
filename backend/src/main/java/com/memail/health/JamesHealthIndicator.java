package com.memail.health;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.Socket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Custom health indicator for Apache James mail server
 * Checks IMAP, SMTP, and WebAdmin connectivity
 */
@Component
public class JamesHealthIndicator implements HealthIndicator {

    @Value("${mail.imap.host:localhost}")
    private String imapHost;

    @Value("${mail.imap.port:143}")
    private int imapPort;

    @Value("${mail.smtp.host:localhost}")
    private String smtpHost;

    @Value("${mail.smtp.port:587}")
    private int smtpPort;

    @Value("${james.webadmin.host:localhost}")
    private String webAdminHost;

    @Value("${james.webadmin.port:8000}")
    private int webAdminPort;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Override
    public Health health() {
        try {
            boolean imapUp = checkPort(imapHost, imapPort);
            boolean smtpUp = checkPort(smtpHost, smtpPort);
            boolean webAdminUp = checkWebAdmin();

            if (imapUp && smtpUp && webAdminUp) {
                return Health.up()
                        .withDetail("imap", "UP - " + imapHost + ":" + imapPort)
                        .withDetail("smtp", "UP - " + smtpHost + ":" + smtpPort)
                        .withDetail("webadmin", "UP - " + webAdminHost + ":" + webAdminPort)
                        .build();
            } else {
                return Health.down()
                        .withDetail("imap", imapUp ? "UP" : "DOWN - " + imapHost + ":" + imapPort)
                        .withDetail("smtp", smtpUp ? "UP" : "DOWN - " + smtpHost + ":" + smtpPort)
                        .withDetail("webadmin", webAdminUp ? "UP" : "DOWN - " + webAdminHost + ":" + webAdminPort)
                        .build();
            }
        } catch (Exception e) {
            return Health.down()
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }

    /**
     * Check if a port is reachable
     */
    private boolean checkPort(String host, int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new java.net.InetSocketAddress(host, port), 3000);
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    /**
     * Check James WebAdmin health endpoint
     */
    private boolean checkWebAdmin() {
        try {
            String healthUrl = "http://" + webAdminHost + ":" + webAdminPort + "/healthcheck";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(healthUrl))
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }
}
