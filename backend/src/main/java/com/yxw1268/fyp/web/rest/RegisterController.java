package com.yxw1268.fyp.web.rest;

import com.yxw1268.fyp.service.OtpService;
import com.yxw1268.fyp.service.OtpService.Purpose;
import com.yxw1268.fyp.service.OtpService.VerifyResult;
import com.yxw1268.fyp.service.ResendMailClient;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/register")
public class RegisterController {

    /** How long a verified email stays eligible to complete registration. */
    public static final Duration REGISTER_TOKEN_TTL = Duration.ofMinutes(30);

    private final Logger log = LoggerFactory.getLogger(RegisterController.class);
    private final OtpService otpService;
    private final ResendMailClient mailClient;

    public RegisterController(OtpService otpService, ResendMailClient mailClient) {
        this.otpService = otpService;
        this.mailClient = mailClient;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, Object>> sendOtp(@RequestBody EmailVM emailVM) {
        String email = OtpService.normalizeEmail(emailVM.getEmail());
        if (!OtpService.isValidEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid email address"));
        }
        log.debug("REST request to send OTP to email: {}", email);

        Optional<String> otp = otpService.issueOtp(email, Purpose.REGISTER);
        if (otp.isEmpty()) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                Map.of("error", "A code was just sent. Please wait a minute before requesting another.")
            );
        }

        mailClient.sendOtp(email, "OnyxFit Verification Code", "Your verification code for OnyxFit is:", otp.orElseThrow());

        return ResponseEntity.ok(Map.of("message", "otp_sent", "expiresIn", OtpService.OTP_TTL.toSeconds()));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody OtpVM otpVM) {
        String email = OtpService.normalizeEmail(otpVM.getEmail());
        log.debug("REST request to verify OTP for email: {}", email);

        VerifyResult result = otpService.verifyOtp(email, Purpose.REGISTER, otpVM.getOtp());
        if (result != VerifyResult.OK) {
            return ResponseEntity.badRequest().body(Map.of("error", describe(result)));
        }

        // The client must present this token to POST /api/register for the same email.
        String tempToken = otpService.issueToken(email, Purpose.REGISTER_TOKEN, REGISTER_TOKEN_TTL);
        return ResponseEntity.ok(Map.of("verified", true, "tempToken", tempToken));
    }

    static String describe(VerifyResult result) {
        return switch (result) {
            case NOT_FOUND -> "No OTP found";
            case EXPIRED -> "OTP expired";
            case TOO_MANY_ATTEMPTS -> "Too many incorrect attempts. Please request a new code.";
            default -> "Invalid OTP";
        };
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
