package com.yxw1268.fyp.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

public class PlanTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));
    private static final AtomicInteger intCount = new AtomicInteger(random.nextInt() + (2 * Short.MAX_VALUE));

    public static Plan getPlanSample1() {
        return new Plan().id(1L).caloriesKcal(1).source("source1");
    }

    public static Plan getPlanSample2() {
        return new Plan().id(2L).caloriesKcal(2).source("source2");
    }

    public static Plan getPlanRandomSampleGenerator() {
        return new Plan().id(longCount.incrementAndGet()).caloriesKcal(intCount.incrementAndGet()).source(UUID.randomUUID().toString());
    }
}
