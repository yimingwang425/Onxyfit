package com.yxw1268.fyp.web.rest;

import com.yxw1268.fyp.repository.UserRepository;
import com.yxw1268.fyp.service.OtpService;
import com.yxw1268.fyp.service.OtpService.Purpose;
import com.yxw1268.fyp.service.OtpService.VerifyResult;
import com.yxw1268.fyp.service.ResendMailClient;
import com.yxw1268.fyp.service.UserService;
import com.yxw1268.fyp.web.rest.vm.ManagedUserVM;
import java.time.Duration;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account/reset-password")
public class PasswordResetController {

    private static final Duration RESET_TOKEN_TTL = Duration.ofMinutes(15);

    private final Logger log = LoggerFactory.getLogger(PasswordResetController.class);
    private final OtpService otpService;
    private final ResendMailClient mailClient;
    private final UserRepository userRepository;
    private final UserService userService;

    public PasswordResetController(
        OtpService otpService,
        ResendMailClient mailClient,
        UserRepository userRepository,
        UserService userService
    ) {
        this.otpService = otpService;
        this.mailClient = mailClient;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    /**
     * POST /api/account/reset-password/init
     * Send OTP to email for password reset
     */
    @PostMapping("/init")
    public ResponseEntity<Map<String, Object>> initPasswordReset(@RequestBody Map<String, String> body) {
        String email = OtpService.normalizeEmail(body.get("email"));
        log.debug("Password reset request for email: {}", email);

        // Same response whether or not the email exists or a code was just sent,
        // so this endpoint can't be used to probe for accounts.
        if (OtpService.isValidEmail(email) && userRepository.findOneByEmailIgnoreCase(email).isPresent()) {
            otpService
                .issueOtp(email, Purpose.PASSWORD_RESET)
                .ifPresent(otp ->
                    mailClient.sendOtp(
                        email,
                        "OnyxFit - Password Reset Verification",
                        "You requested to reset your password. Your verification code is:",
                        otp
                    )
                );
        }

        return ResponseEntity.ok(Map.of("message", "otp_sent", "expiresIn", OtpService.OTP_TTL.toSeconds()));
    }

    /**
     * POST /api/account/reset-password/verify
     * Verify OTP and return a reset token
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyResetOtp(@RequestBody Map<String, String> body) {
        String email = OtpService.normalizeEmail(body.get("email"));
        log.debug("Verify password reset OTP for {}", email);

        VerifyResult result = otpService.verifyOtp(email, Purpose.PASSWORD_RESET, body.get("otp"));
        if (result != VerifyResult.OK) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", RegisterController.describe(result)));
        }

        String resetToken = otpService.issueToken(email, Purpose.PASSWORD_RESET_TOKEN, RESET_TOKEN_TTL);
        return ResponseEntity.ok(Map.of("success", true, "resetToken", resetToken));
    }

    /**
     * POST /api/account/reset-password/finish
     * Set new password using reset token
     */
    @PostMapping("/finish")
    public ResponseEntity<Map<String, Object>> finishPasswordReset(@RequestBody Map<String, String> body) {
        String email = OtpService.normalizeEmail(body.get("email"));
        String newPassword = body.get("newPassword");
        log.debug("Finish password reset for {}", email);

        if (
            newPassword == null ||
            newPassword.length() < ManagedUserVM.PASSWORD_MIN_LENGTH ||
            newPassword.length() > ManagedUserVM.PASSWORD_MAX_LENGTH
        ) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Invalid password"));
        }

        if (!otpService.consumeToken(email, Purpose.PASSWORD_RESET_TOKEN, body.get("resetToken"))) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Invalid or expired reset token"));
        }

        if (userService.resetPasswordByEmail(email, newPassword).isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Invalid or expired reset token"));
        }

        log.info("Password successfully reset for {}", email);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
