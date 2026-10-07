package com.yxw1268.fyp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Sends transactional email through the Resend HTTP API.
 */
@Service
public class ResendMailClient {

    private static final Logger LOG = LoggerFactory.getLogger(ResendMailClient.class);

    private static final String FROM = "OnyxFit <system@onyx-fit.app>";

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    private final ObjectMapper objectMapper;

    private final String apiKey;

    public ResendMailClient(ObjectMapper objectMapper, @Value("${RESEND_API_KEY:}") String apiKey) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
    }

    public void send(String toEmail, String subject, String htmlContent) {
        try {
            String jsonBody = objectMapper.writeValueAsString(
                Map.of("from", FROM, "to", List.of(toEmail), "subject", subject, "html", htmlContent)
            );

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.resend.com/emails"))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                LOG.warn("Resend API returned {}: {}", response.statusCode(), response.body());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            LOG.error("Interrupted while sending email via Resend", e);
        } catch (Exception e) {
            LOG.error("Failed to send email via Resend", e);
        }
    }

    /**
     * Send the standard "here is your verification code" email.
     */
    public void sendOtp(String toEmail, String subject, String intro, String code) {
        String content =
            "<html><body>" +
            "<h3>Hello!</h3>" +
            "<p>" + intro + "</p>" +
            "<h1>" + code + "</h1>" +
            "<p>This code will expire in 10 minutes.</p>" +
            "<p>If you did not request this, please ignore this email.</p>" +
            "</body></html>";
        send(toEmail, subject, content);
    }
}
