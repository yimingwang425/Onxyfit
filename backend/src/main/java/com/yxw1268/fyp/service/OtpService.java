package com.yxw1268.fyp.service;

import com.yxw1268.fyp.domain.OtpRecord;
import com.yxw1268.fyp.repository.OtpRecordRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Issues and checks the one-time codes and follow-up tokens used by the
 * registration, password reset and change email flows.
 */
@Service
@Transactional
public class OtpService {

    public enum Purpose {
        REGISTER,
        REGISTER_TOKEN,
        PASSWORD_RESET,
        PASSWORD_RESET_TOKEN,
        CHANGE_EMAIL,
    }

    public enum VerifyResult {
        OK,
        NOT_FOUND,
        EXPIRED,
        INVALID,
        TOO_MANY_ATTEMPTS,
    }

    public static final Duration OTP_TTL = Duration.ofMinutes(10);
    public static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    public static final int MAX_ATTEMPTS = 5;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final int EMAIL_MAX_LENGTH = 254;

    private final SecureRandom secureRandom = new SecureRandom();

    private final OtpRecordRepository otpRecordRepository;

    public OtpService(OtpRecordRepository otpRecordRepository) {
        this.otpRecordRepository = otpRecordRepository;
    }

    public static boolean isValidEmail(String email) {
        return email != null && email.length() <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.matcher(email).matches();
    }

    public static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * Issue a new 6-digit code, replacing any earlier one for the same email and purpose.
     *
     * @return the code, or empty if one was issued less than {@link #RESEND_COOLDOWN} ago.
     */
    public Optional<String> issueOtp(String email, Purpose purpose) {
        String key = normalizeEmail(email);
        Instant now = Instant.now();

        Optional<OtpRecord> latest = otpRecordRepository.findFirstByEmailAndPurposeOrderByExpiryTimeDesc(key, purpose.name());
        if (latest.isPresent() && latest.orElseThrow().getExpiryTime().minus(OTP_TTL).plus(RESEND_COOLDOWN).isAfter(now)) {
            return Optional.empty();
        }

        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        replace(key, purpose, code, now.plus(OTP_TTL));
        return Optional.of(code);
    }

    /**
     * Check a code. A correct code is single use; a wrong one counts towards {@link #MAX_ATTEMPTS}.
     */
    public VerifyResult verifyOtp(String email, Purpose purpose, String code) {
        String key = normalizeEmail(email);
        Optional<OtpRecord> recordOpt = otpRecordRepository.findFirstByEmailAndPurposeOrderByExpiryTimeDesc(key, purpose.name());
        if (recordOpt.isEmpty()) {
            return VerifyResult.NOT_FOUND;
        }

        OtpRecord record = recordOpt.orElseThrow();
        if (Instant.now().isAfter(record.getExpiryTime())) {
            return VerifyResult.EXPIRED;
        }

        int attempts = record.getAttempts() == null ? 0 : record.getAttempts();
        if (attempts >= MAX_ATTEMPTS) {
            return VerifyResult.TOO_MANY_ATTEMPTS;
        }

        if (!constantTimeEquals(record.getOtpCode(), code)) {
            record.setAttempts(attempts + 1);
            otpRecordRepository.save(record);
            return VerifyResult.INVALID;
        }

        otpRecordRepository.delete(record);
        return VerifyResult.OK;
    }

    /**
     * Issue a random single-use token, replacing any earlier one for the same email and purpose.
     */
    public String issueToken(String email, Purpose purpose, Duration ttl) {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String token = HexFormat.of().formatHex(bytes);
        replace(normalizeEmail(email), purpose, token, Instant.now().plus(ttl));
        return token;
    }

    @Transactional(readOnly = true)
    public boolean isTokenValid(String email, Purpose purpose, String token) {
        return findValidToken(email, purpose, token).isPresent();
    }

    /**
     * Check a token and, if it is valid, invalidate it.
     */
    public boolean consumeToken(String email, Purpose purpose, String token) {
        Optional<OtpRecord> record = findValidToken(email, purpose, token);
        record.ifPresent(otpRecordRepository::delete);
        return record.isPresent();
    }

    private Optional<OtpRecord> findValidToken(String email, Purpose purpose, String token) {
        return otpRecordRepository
            .findFirstByEmailAndPurposeOrderByExpiryTimeDesc(normalizeEmail(email), purpose.name())
            .filter(record -> Instant.now().isBefore(record.getExpiryTime()))
            .filter(record -> constantTimeEquals(record.getOtpCode(), token));
    }

    private void replace(String email, Purpose purpose, String value, Instant expiryTime) {
        otpRecordRepository.deleteAllByEmailAndPurpose(email, purpose.name());
        otpRecordRepository.flush();

        OtpRecord record = new OtpRecord();
        record.setEmail(email);
        record.setPurpose(purpose.name());
        record.setOtpCode(value);
        record.setVerified(false);
        record.setAttempts(0);
        record.setExpiryTime(expiryTime);
        otpRecordRepository.save(record);
    }

    private static boolean constantTimeEquals(String expected, String actual) {
        if (expected == null || actual == null) {
            return false;
        }
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), actual.getBytes(StandardCharsets.UTF_8));
    }
}
