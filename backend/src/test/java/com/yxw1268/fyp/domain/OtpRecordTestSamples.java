package com.yxw1268.fyp.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class OtpRecordTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static OtpRecord getOtpRecordSample1() {
        return new OtpRecord().id(1L).email("email1").otpCode("otpCode1");
    }

    public static OtpRecord getOtpRecordSample2() {
        return new OtpRecord().id(2L).email("email2").otpCode("otpCode2");
    }

    public static OtpRecord getOtpRecordRandomSampleGenerator() {
        return new OtpRecord().id(longCount.incrementAndGet()).email(UUID.randomUUID().toString()).otpCode(UUID.randomUUID().toString());
    }
}
