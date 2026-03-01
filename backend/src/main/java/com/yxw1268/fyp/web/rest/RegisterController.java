package com.yxw1268.fyp.web.rest;

import com.yxw1268.fyp.domain.OtpRecord;
import com.yxw1268.fyp.service.OtpRecordService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.Random;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/api/register")
public class RegisterController {

    private final Logger log = LoggerFactory.getLogger(RegisterController.class);
    private final OtpRecordService otpRecordService;

    // Resend API
    private static final String RESEND_API_KEY = System.getenv("RESEND_API_KEY") != null
        ? System.getenv("RESEND_API_KEY") : "";

    public RegisterController(OtpRecordService otpRecordService) {
        this.otpRecordService = otpRecordService;
    }

    private void sendEmailViaResend(String toEmail, String subject, String htmlContent) {
        try {
            String jsonBody = String.format(
                "{\"from\":\"OnyxFit <system@onyx-fit.app>\",\"to\":[\"%s\"],\"subject\":\"%s\",\"html\":\"%s\"}",
                toEmail,
                subject,
                htmlContent.replace("\"", "\\\"")
            );

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.resend.com/emails"))
                .header("Authorization", "Bearer " + RESEND_API_KEY)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("Resend API response: {} - {}", response.statusCode(), response.body());

            if (response.statusCode() != 200) {
                log.warn("Resend API returned non-200: {}", response.body());
            }
        } catch (Exception e) {
            log.error("Failed to send email via Resend", e);
        }
    }

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, Object>> sendOtp(@RequestBody EmailVM emailVM) {
        String email = emailVM.getEmail();
        log.debug("REST request to send OTP to email: {}", email);

        String otp = String.format("%06d", new Random().nextInt(999999));

        OtpRecord record = new OtpRecord();
        record.setEmail(email);
        record.setOtpCode(otp);
        record.setVerified(false);
        record.setExpiryTime(Instant.now().plus(10, ChronoUnit.MINUTES));
        otpRecordService.save(record);

        String subject = "OnyxFit Verification Code";
        String content = "<html><body>" +
                "<h3>Hello!</h3>" +
                "<p>Your verification code for OnyxFit is:</p>" +
                "<h1>" + otp + "</h1>" +
                "<p>This code will expire in 10 minutes.</p>" +
                "</body></html>";

        sendEmailViaResend(email, subject, content);

        //log OTP for debug
        log.info("OTP for {}: {}", email, otp);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "otp_sent");
        response.put("expiresIn", 600);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody OtpVM otpVM) {
        log.debug("REST request to verify OTP for email: {}", otpVM.getEmail());

        List<OtpRecord> records = otpRecordService.findAll();

        Optional<OtpRecord> recordOpt = records.stream()
            .filter(r -> r.getEmail().equalsIgnoreCase(otpVM.getEmail()))
            .max((r1, r2) -> r1.getExpiryTime().compareTo(r2.getExpiryTime()));

        if (recordOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No OTP found"));
        }

        OtpRecord record = recordOpt.get();

        if (Instant.now().isAfter(record.getExpiryTime())) {
            return ResponseEntity.status(400).body(Map.of("error", "OTP expired"));
        }

        if (!record.getOtpCode().equals(otpVM.getOtp())) {
            return ResponseEntity.status(400).body(Map.of("error", "Invalid OTP"));
        }

        record.setVerified(true);
        otpRecordService.save(record);

        Map<String, Object> response = new HashMap<>();
        response.put("verified", true);
        response.put("tempToken", "verified-" + System.currentTimeMillis());
        return ResponseEntity.ok(response);
    }

    public static class EmailVM {
        private String email;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class OtpVM {
        private String email;
        private String otp;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getOtp() { return otp; }
        public void setOtp(String otp) { this.otp = otp; }
    }
}