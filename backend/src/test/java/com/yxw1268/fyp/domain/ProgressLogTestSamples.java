package com.yxw1268.fyp.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

public class ProgressLogTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));
    private static final AtomicInteger intCount = new AtomicInteger(random.nextInt() + (2 * Short.MAX_VALUE));

    public static ProgressLog getProgressLogSample1() {
        return new ProgressLog().id(1L).caloriesIntake(1).steps(1).notes("notes1");
    }

    public static ProgressLog getProgressLogSample2() {
        return new ProgressLog().id(2L).caloriesIntake(2).steps(2).notes("notes2");
    }

    public static ProgressLog getProgressLogRandomSampleGenerator() {
        return new ProgressLog()
            .id(longCount.incrementAndGet())
            .caloriesIntake(intCount.incrementAndGet())
            .steps(intCount.incrementAndGet())
            .notes(UUID.randomUUID().toString());
    }
}
