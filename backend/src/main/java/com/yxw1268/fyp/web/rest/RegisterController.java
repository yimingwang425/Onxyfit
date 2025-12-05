package com.yxw1268.fyp.web.rest;

import com.yxw1268.fyp.domain.OtpRecord;
import com.yxw1268.fyp.service.MailService;
import com.yxw1268.fyp.service.OtpRecordService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
    private final MailService mailService;
    private final OtpRecordService otpRecordService;

    public RegisterController(MailService mailService, OtpRecordService otpRecordService) {
        this.mailService = mailService;
        this.otpRecordService = otpRecordService;
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

        String subject = "FYP Verification Code";
        String content = "<html><body>" +
                "<h3>Hello!</h3>" +
                "<p>Your verification code for FYP App is:</p>" +
                "<h1>" + otp + "</h1>" +
                "<p>This code will expire in 10 minutes.</p>" +
                "</body></html>";
        
        try {
            mailService.sendEmail(email, subject, content, false, true);
        } catch (Exception e) {
            log.error("Failed to send email", e);
        }

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