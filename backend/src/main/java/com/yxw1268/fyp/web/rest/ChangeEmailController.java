package com.yxw1268.fyp.web.rest;

import com.yxw1268.fyp.domain.OtpRecord;
import com.yxw1268.fyp.domain.User;
import com.yxw1268.fyp.repository.UserRepository;
import com.yxw1268.fyp.security.SecurityUtils;
import com.yxw1268.fyp.service.OtpRecordService;
import org.springframework.cache.CacheManager;
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
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/account/change-email")
public class ChangeEmailController {

    private final Logger log = LoggerFactory.getLogger(ChangeEmailController.class);
    private final OtpRecordService otpRecordService;
    private final UserRepository userRepository;
    private final CacheManager cacheManager;

    private static final String RESEND_API_KEY = System.getenv("RESEND_API_KEY") != null
        ? System.getenv("RESEND_API_KEY") : "";

    public ChangeEmailController(OtpRecordService otpRecordService, UserRepository userRepository, CacheManager cacheManager) {
        this.otpRecordService = otpRecordService;
        this.userRepository = userRepository;
        this.cacheManager = cacheManager;
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

    @PostMapping("/request")
    public ResponseEntity<Map<String, Object>> requestChangeEmail(@RequestBody Map<String, String> body) {
        String newEmail = body.get("newEmail");
        String currentLogin = SecurityUtils.getCurrentUserLogin().orElse("");
        log.info("Change email request from user {} to new email {}", currentLogin, newEmail);

        // Check if email is already registered (check both login and email columns)
        Optional<User> existingByEmail = userRepository.findOneByEmailIgnoreCase(newEmail);
        Optional<User> existingByLogin = userRepository.findOneByLogin(newEmail.toLowerCase());
        if (existingByEmail.isPresent() || existingByLogin.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "This email is already registered"));
        }

        String otp = String.format("%06d", new Random().nextInt(999999));

        OtpRecord record = new OtpRecord();
        record.setEmail(newEmail);
        record.setOtpCode(otp);
        record.setVerified(false);
        record.setExpiryTime(Instant.now().plus(10, ChronoUnit.MINUTES));
        otpRecordService.save(record);

        String subject = "OnyxFit - Change Email Verification";
        String content = "<html><body>" +
                "<h3>Hello!</h3>" +
                "<p>You requested to change your email. Your verification code is:</p>" +
                "<h1>" + otp + "</h1>" +
                "<p>This code will expire in 10 minutes.</p>" +
                "</body></html>";

        sendEmailViaResend(newEmail, subject, content);
        log.info("Change email OTP for {}: {}", newEmail, otp);

        return ResponseEntity.ok(Map.of("message", "otp_sent", "expiresIn", 600));
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyChangeEmail(@RequestBody Map<String, String> body) {
        String newEmail = body.get("newEmail");
        String otp = body.get("otp");
        String currentLogin = SecurityUtils.getCurrentUserLogin().orElse("");
        log.info("Verify change email OTP for user {} to {}", currentLogin, newEmail);

        List<OtpRecord> records = otpRecordService.findAll();
        Optional<OtpRecord> recordOpt = records.stream()
            .filter(r -> r.getEmail().equalsIgnoreCase(newEmail))
            .max((r1, r2) -> r1.getExpiryTime().compareTo(r2.getExpiryTime()));

        if (recordOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("verified", false, "error", "No OTP found"));
        }

        OtpRecord record = recordOpt.get();

        if (Instant.now().isAfter(record.getExpiryTime())) {
            return ResponseEntity.badRequest().body(Map.of("verified", false, "error", "OTP expired"));
        }

        if (!record.getOtpCode().equals(otp)) {
            return ResponseEntity.badRequest().body(Map.of("verified", false, "error", "Invalid OTP"));
        }

        record.setVerified(true);
        otpRecordService.save(record);

        // Update user's login AND email in database
        Optional<User> userOpt = userRepository.findOneByLogin(currentLogin);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            Objects.requireNonNull(cacheManager.getCache(UserRepository.USERS_BY_LOGIN_CACHE)).evict(currentLogin);
            if (user.getEmail() != null) {
                Objects.requireNonNull(cacheManager.getCache(UserRepository.USERS_BY_EMAIL_CACHE)).evict(user.getEmail());
            }
            user.setLogin(newEmail.toLowerCase());
            user.setEmail(newEmail.toLowerCase());
            userRepository.saveAndFlush(user);
            Objects.requireNonNull(cacheManager.getCache(UserRepository.USERS_BY_LOGIN_CACHE)).evict(newEmail.toLowerCase());
            Objects.requireNonNull(cacheManager.getCache(UserRepository.USERS_BY_EMAIL_CACHE)).evict(newEmail.toLowerCase());
            log.info("User {} login and email updated to {}", currentLogin, newEmail);
        }

        return ResponseEntity.ok(Map.of("verified", true));
    }
}