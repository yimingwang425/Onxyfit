package com.yxw1268.fyp.web.rest;

import com.yxw1268.fyp.domain.User;
import com.yxw1268.fyp.repository.UserRepository;
import com.yxw1268.fyp.security.SecurityUtils;
import com.yxw1268.fyp.service.OtpService;
import com.yxw1268.fyp.service.OtpService.Purpose;
import com.yxw1268.fyp.service.OtpService.VerifyResult;
import com.yxw1268.fyp.service.ResendMailClient;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@RestController
@RequestMapping("/api/account/change-email")
public class ChangeEmailController {

    private final Logger log = LoggerFactory.getLogger(ChangeEmailController.class);
    private final OtpService otpService;
    private final ResendMailClient mailClient;
    private final UserRepository userRepository;
    private final CacheManager cacheManager;

    public ChangeEmailController(
        OtpService otpService,
        ResendMailClient mailClient,
        UserRepository userRepository,
        CacheManager cacheManager
    ) {
        this.otpService = otpService;
        this.mailClient = mailClient;
        this.userRepository = userRepository;
        this.cacheManager = cacheManager;
    }

    @PostMapping("/request")
    public ResponseEntity<Map<String, Object>> requestChangeEmail(@RequestBody Map<String, String> body) {
        String newEmail = OtpService.normalizeEmail(body.get("newEmail"));
        String currentLogin = SecurityUtils.getCurrentUserLogin().orElse("");
        log.info("Change email request from user {} to new email {}", currentLogin, newEmail);

        if (!OtpService.isValidEmail(newEmail)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid email address"));
        }

        // Check if email is already registered (check both login and email columns)
        Optional<User> existingByEmail = userRepository.findOneByEmailIgnoreCase(newEmail);
        Optional<User> existingByLogin = userRepository.findOneByLogin(newEmail);
        if (existingByEmail.isPresent() || existingByLogin.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "This email is already registered"));
        }

        Optional<String> otp = otpService.issueOtp(newEmail, Purpose.CHANGE_EMAIL);
        if (otp.isEmpty()) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                Map.of("error", "A code was just sent. Please wait a minute before requesting another.")
            );
        }

        mailClient.sendOtp(
            newEmail,
            "OnyxFit - Change Email Verification",
            "You requested to change your email. Your verification code is:",
            otp.orElseThrow()
        );

        return ResponseEntity.ok(Map.of("message", "otp_sent", "expiresIn", OtpService.OTP_TTL.toSeconds()));
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyChangeEmail(@RequestBody Map<String, String> body) {
        String newEmail = OtpService.normalizeEmail(body.get("newEmail"));
        String currentLogin = SecurityUtils.getCurrentUserLogin().orElse("");
        log.info("Verify change email OTP for user {} to {}", currentLogin, newEmail);

        VerifyResult result = otpService.verifyOtp(newEmail, Purpose.CHANGE_EMAIL, body.get("otp"));
        if (result != VerifyResult.OK) {
            return ResponseEntity.badRequest().body(Map.of("verified", false, "error", RegisterController.describe(result)));
        }

        // Someone else may have taken the address since the code was requested
        if (userRepository.findOneByEmailIgnoreCase(newEmail).isPresent() || userRepository.findOneByLogin(newEmail).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("verified", false, "error", "This email is already registered"));
        }

        // Update user's login AND email in database
        Optional<User> userOpt = userRepository.findOneByLogin(currentLogin);
        if (userOpt.isPresent()) {
            User user = userOpt.orElseThrow();
            Objects.requireNonNull(cacheManager.getCache(UserRepository.USERS_BY_LOGIN_CACHE)).evict(currentLogin);
            if (user.getEmail() != null) {
                Objects.requireNonNull(cacheManager.getCache(UserRepository.USERS_BY_EMAIL_CACHE)).evict(user.getEmail());
            }
            user.setLogin(newEmail);
            user.setEmail(newEmail);
            userRepository.saveAndFlush(user);
            Objects.requireNonNull(cacheManager.getCache(UserRepository.USERS_BY_LOGIN_CACHE)).evict(newEmail);
            Objects.requireNonNull(cacheManager.getCache(UserRepository.USERS_BY_EMAIL_CACHE)).evict(newEmail);
            log.info("User {} login and email updated to {}", currentLogin, newEmail);
        }

        return ResponseEntity.ok(Map.of("verified", true));
    }
}