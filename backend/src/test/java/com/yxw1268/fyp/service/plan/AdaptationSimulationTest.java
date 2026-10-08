package com.yxw1268.fyp.service.plan;

import static org.assertj.core.api.Assertions.assertThat;

import com.yxw1268.fyp.domain.enumeration.ActivityLevel;
import com.yxw1268.fyp.domain.enumeration.DietPref;
import com.yxw1268.fyp.domain.enumeration.Goal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Random;
import org.junit.jupiter.api.Test;

/**
 * Simulation of the weekly adaptation loop on synthetic users, using the real {@link PlanEngine}.
 *
 * <p>Each simulated user has a true maintenance that differs from what the formula predicts, eats
 * roughly to plan, and weighs in a few times a week with day-to-day noise. Every week the engine
 * adapts from those weigh-ins, exactly as in production. The same users are also run with the
 * adaptation switched off, as a baseline.
 *
 * <p>What is measured is the energy-balance error: how far the calorie balance the user actually
 * ends up in is from the one their plan intends (kcal a day). It is what decides whether someone
 * told they are in a 500 kcal deficit really is.
 *
 * <p>These are simulated people, not users: the numbers say how the algorithm behaves under the
 * stated assumptions, nothing about real-world outcomes.
 */
class AdaptationSimulationTest {

    private static final int USERS = 1000;
    private static final int WEEKS = 12;
    private static final Instant START = Instant.parse("2026-01-04T00:00:00Z");

    /**
     * @param maintenanceSd spread of true maintenance around the formula, as a fraction of it
     * @param intakeBiasMean and intakeBiasSd: how much more (or less) than planned a user eats, as a fraction
     * @param weighInsPerWeek average number of weigh-ins a week
     * @param scaleNoiseKg day-to-day fluctuation of measured body weight
     */
    private record Scenario(String name, double maintenanceSd, double intakeBiasMean, double intakeBiasSd, double weighInsPerWeek, double scaleNoiseKg) {}

    private record Outcome(double[][] errorByWeek) {
        double median(int week) {
            double[] sorted = Arrays.stream(errorByWeek).mapToDouble(user -> user[week]).sorted().toArray();
            return sorted[sorted.length / 2];
        }

        double mean(int week) {
            return Arrays.stream(errorByWeek).mapToDouble(user -> user[week]).average().orElseThrow();
        }

        double shareWithin(int week, double kcal) {
            return Arrays.stream(errorByWeek).filter(user -> user[week] <= kcal).count() / (double) errorByWeek.length;
        }
    }

    @Test
    void adaptationBringsUsersCloserToTheirIntendedEnergyBalance() {
        List<Scenario> scenarios = List.of(
            new Scenario("A. eats to plan, 3 weigh-ins/week", 0.10, 0.0, 0.0, 3, 0.4),
            new Scenario("B. eats 5% over plan on average", 0.10, 0.05, 0.05, 3, 0.4),
            new Scenario("C. 2 weigh-ins/week, noisier scale", 0.10, 0.0, 0.0, 2, 0.6),
            new Scenario("D. formula already right (control)", 0.0, 0.0, 0.0, 3, 0.4)
        );

        StringBuilder report = new StringBuilder("\n=== Adaptation simulation: " + USERS + " simulated users, " + WEEKS + " weeks ===\n");
        report.append("Energy-balance error = |actual calorie balance - balance the plan intends|, kcal/day\n");

        for (Scenario scenario : scenarios) {
            Outcome adaptive = simulate(scenario, true);
            Outcome baseline = simulate(scenario, false);

            report.append(String.format(Locale.ROOT, "%n%s%n", scenario.name()));
            report.append("  week | median error       | mean error         | within 100 kcal\n");
            report.append("       | formula   adaptive | formula   adaptive | formula   adaptive\n");
            for (int week : new int[] { 0, 4, 8, 12 }) {
                report.append(
                    String.format(
                        Locale.ROOT,
                        "  %4d | %7.0f   %8.0f | %7.0f   %8.0f | %6.0f%%   %7.0f%%%n",
                        week,
                        baseline.median(week),
                        adaptive.median(week),
                        baseline.mean(week),
                        adaptive.mean(week),
                        100 * baseline.shareWithin(week, 100),
                        100 * adaptive.shareWithin(week, 100)
                    )
                );
            }
            long worse = 0;
            for (int user = 0; user < USERS; user++) {
                if (adaptive.errorByWeek()[user][WEEKS] > baseline.errorByWeek()[user][WEEKS] + 50) {
                    worse++;
                }
            }
            report.append(String.format(Locale.ROOT, "  users left more than 50 kcal worse off by adapting, at week %d: %.1f%%%n", WEEKS, 100.0 * worse / USERS));

            if (scenario.maintenanceSd() > 0) {
                // where the formula is off, adapting must clearly help
                assertThat(adaptive.median(WEEKS)).as(scenario.name()).isLessThan(0.75 * baseline.median(WEEKS));
            } else {
                // where the formula is right, noise alone must not push people far off
                assertThat(adaptive.median(WEEKS)).as(scenario.name()).isLessThan(75);
            }
        }
        System.out.println(report);
    }

    /**
     * How strongly to correct each week is a trade-off: a high gain reaches the right level sooner
     * but keeps chasing noise once there. This prints both sides of it for a range of gains.
     */
    @Test
    void gainSweep() {
        Scenario formulaOff = new Scenario("formula off by 10% SD", 0.10, 0.0, 0.0, 3, 0.4);
        Scenario formulaRight = new Scenario("formula right", 0.0, 0.0, 0.0, 3, 0.4);
        Scenario sparse = new Scenario("formula off, 2 weigh-ins/week", 0.10, 0.0, 0.0, 2, 0.6);

        StringBuilder report = new StringBuilder("\n=== Gain sweep: median energy-balance error, kcal/day ===\n");
        report.append("  gain | formula off        | formula right | sparse, noisy\n");
        report.append("       | week 4    week 12  | week 12       | week 12\n");
        for (double gain : new double[] { Double.NaN, 0.5, 0.35, 0.25, 0.15 }) {
            Outcome off = simulate(formulaOff, gain);
            Outcome right = simulate(formulaRight, gain);
            Outcome noisy = simulate(sparse, gain);
            report.append(
                String.format(
                    Locale.ROOT,
                    "  %4s | %6.0f    %7.0f  | %7.0f       | %7.0f%n",
                    Double.isNaN(gain) ? "off" : String.valueOf(gain),
                    off.median(4),
                    off.median(WEEKS),
                    right.median(WEEKS),
                    noisy.median(WEEKS)
                )
            );
        }
        System.out.println(report);
    }

    private static Outcome simulate(Scenario scenario, boolean adapt) {
        return simulate(scenario, adapt ? PlanEngine.ADAPTATION_GAIN : Double.NaN);
    }

    /**
     * @param gain the share of the weight-trend error corrected per week; NaN switches adaptation off
     */
    private static Outcome simulate(Scenario scenario, double gain) {
        boolean adapt = !Double.isNaN(gain);
        // the same seed for both runs: the adaptive and the baseline user are the same person
        Random random = new Random(42);
        double[][] errors = new double[USERS][WEEKS + 1];

        for (int user = 0; user < USERS; user++) {
            boolean male = random.nextBoolean();
            int age = 20 + random.nextInt(36);
            double heightCm = (male ? 176 : 163) + random.nextGaussian() * (male ? 7 : 6);
            double bmi = 20 + random.nextDouble() * 12;
            double weight = bmi * Math.pow(heightCm / 100, 2);
            ActivityLevel activity = ActivityLevel.values()[random.nextInt(ActivityLevel.values().length)];
            Goal goal = Goal.values()[random.nextInt(Goal.values().length)];
            double maintenanceFactor = 1 + clamp(random.nextGaussian() * scenario.maintenanceSd(), -0.25, 0.25);
            double intakeFactor = 1 + scenario.intakeBiasMean() + random.nextGaussian() * scenario.intakeBiasSd();

            List<LogEntry> logs = new ArrayList<>();
            double measuredWeight = weight;
            PlanTargets plan = PlanEngine.build(input(age, heightCm, measuredWeight, male, activity, goal), AdaptiveState.INITIAL);
            Instant planCreatedAt = START;

            for (int week = 0; week <= WEEKS; week++) {
                Instant now = START.plus(7L * week, ChronoUnit.DAYS);
                if (week > 0) {
                    AdaptiveState state = adapt
                        ? PlanEngine.adapt(plan.details(), plan.caloriesKcal(), planCreatedAt, logs, now, gain)
                        : AdaptiveState.INITIAL;
                    plan = PlanEngine.build(input(age, heightCm, measuredWeight, male, activity, goal), state);
                    planCreatedAt = now;
                }

                double trueMaintenance = formulaMaintenance(age, heightCm, weight, male, activity, goal) * maintenanceFactor;
                double intended = plan.caloriesKcal() - plan.details().maintenanceKcal();
                double actual = plan.caloriesKcal() * intakeFactor - trueMaintenance;
                errors[user][week] = Math.abs(actual - intended);

                // live the week
                LocalDate monday = LocalDate.ofInstant(now, ZoneOffset.UTC);
                for (int day = 0; day < 7; day++) {
                    double target = plan.details().days().get(day).calories();
                    double eaten = target * intakeFactor + random.nextGaussian() * 150;
                    double burned = formulaMaintenance(age, heightCm, weight, male, activity, goal) * maintenanceFactor;
                    weight += (eaten - burned) / PlanEngine.KCAL_PER_KG;
                    if (random.nextDouble() < scenario.weighInsPerWeek() / 7) {
                        measuredWeight = weight + random.nextGaussian() * scenario.scaleNoiseKg();
                        logs.add(new LogEntry(monday.plusDays(day + 1), measuredWeight, false));
                    }
                }
            }
        }
        return new Outcome(errors);
    }

    private static PlanInput input(int age, double heightCm, double weightKg, boolean male, ActivityLevel activity, Goal goal) {
        return new PlanInput(age, heightCm, weightKg, male, activity, goal, DietPref.BALANCED);
    }

    private static double formulaMaintenance(int age, double heightCm, double weightKg, boolean male, ActivityLevel activity, Goal goal) {
        return PlanEngine.build(input(age, heightCm, weightKg, male, activity, goal), AdaptiveState.INITIAL).details().formulaMaintenanceKcal();
    }

    private static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }
}
