package com.yxw1268.fyp.web.rest;

import com.yxw1268.fyp.domain.OtpRecord;
import com.yxw1268.fyp.domain.User;
import com.yxw1268.fyp.repository.UserRepository;
import com.yxw1268.fyp.service.OtpRecordService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@RestController
@RequestMapping("/api/account/reset-password")
public class PasswordResetController {

    private final Logger log = LoggerFactory.getLogger(PasswordResetController.class);
    private final OtpRecordService otpRecordService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String RESEND_API_KEY = System.getenv("RESEND_API_KEY") != null
        ? System.getenv("RESEND_API_KEY") : "";

    public PasswordResetController(OtpRecordService otpRecordService, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.otpRecordService = otpRecordService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
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
        } catch (Exception e) {
            log.error("Failed to send email via Resend", e);
        }
    }

    /**
     * POST /api/account/reset-password/init
     * Send OTP to email for password reset
     */
    @PostMapping("/init")
    public ResponseEntity<Map<String, Object>> initPasswordReset(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        log.info("Password reset request for email: {}", email);

        //Check if email exists
        Optional<User> userOpt = userRepository.findOneByEmailIgnoreCase(email);
        if (userOpt.isEmpty()) {
            log.warn("Password reset requested for non-existent email: {}", email);
            return ResponseEntity.ok(Map.of("message", "otp_sent", "expiresIn", 600));
        }

        String otp = String.format("%06d", new Random().nextInt(999999));

        OtpRecord record = new OtpRecord();
        record.setEmail(email);
        record.setOtpCode(otp);
        record.setVerified(false);
        record.setExpiryTime(Instant.now().plus(10, ChronoUnit.MINUTES));
        otpRecordService.save(record);

        String subject = "OnyxFit - Password Reset Verification";
        String content = "<html><body>" +
                "<h3>Hello!</h3>" +
                "<p>You requested to reset your password. Your verification code is:</p>" +
                "<h1>" + otp + "</h1>" +
                "<p>This code will expire in 10 minutes.</p>" +
                "<p>If you did not request this, please ignore this email.</p>" +
                "</body></html>";

        sendEmailViaResend(email, subject, content);
        log.info("Password reset OTP for {}: {}", email, otp);

        return ResponseEntity.ok(Map.of("message", "otp_sent", "expiresIn", 600));
    }

    /**
     * POST /api/account/reset-password/verify
     * Verify OTP and return a reset token
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyResetOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        log.info("Verify password reset OTP for {}", email);

        List<OtpRecord> records = otpRecordService.findAll();
        Optional<OtpRecord> recordOpt = records.stream()
            .filter(r -> r.getEmail().equalsIgnoreCase(email))
            .max((r1, r2) -> r1.getExpiryTime().compareTo(r2.getExpiryTime()));

        if (recordOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "No OTP found"));
        }

        OtpRecord record = recordOpt.get();

        if (Instant.now().isAfter(record.getExpiryTime())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "OTP expired"));
        }

        if (!record.getOtpCode().equals(otp)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Invalid OTP"));
        }

        record.setVerified(true);
        otpRecordService.save(record);

        //Generate a reset token
        String resetToken = UUID.randomUUID().toString();
        log.info("Password reset token generated for {}: {}", email, resetToken);

        OtpRecord tokenRecord = new OtpRecord();
        tokenRecord.setEmail(email);
        tokenRecord.setOtpCode(resetToken);
        tokenRecord.setVerified(false);
        tokenRecord.setExpiryTime(Instant.now().plus(15, ChronoUnit.MINUTES));
        otpRecordService.save(tokenRecord);

        return ResponseEntity.ok(Map.of("success", true, "resetToken", resetToken));
    }

    /**
     * POST /api/account/reset-password/finish
     * Set new password using reset token
     */
    @PostMapping("/finish")
    public ResponseEntity<Map<String, Object>> finishPasswordReset(@RequestBody Map<String, String> body) {
        String resetToken = body.get("resetToken");
        String newPassword = body.get("newPassword");
        String email = body.get("email");
        log.info("Finish password reset for {}", email);

        //Find the token record
        List<OtpRecord> records = otpRecordService.findAll();
        Optional<OtpRecord> tokenOpt = records.stream()
            .filter(r -> r.getEmail().equalsIgnoreCase(email) && r.getOtpCode().equals(resetToken))
            .findFirst();

        if (tokenOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Invalid reset token"));
        }

        OtpRecord tokenRecord = tokenOpt.get();

        if (Instant.now().isAfter(tokenRecord.getExpiryTime())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Reset token expired"));
        }

        Optional<User> userOpt = userRepository.findOneByEmailIgnoreCase(email);//Update user password
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "User not found"));
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        //Clean up token
        tokenRecord.setVerified(true);
        otpRecordService.save(tokenRecord);

        log.info("Password successfully reset for {}", email);
        return ResponseEntity.ok(Map.of("success", true));
    }
}