package com.yxw1268.fyp.service.plan;

import com.yxw1268.fyp.domain.enumeration.DietPref;
import com.yxw1268.fyp.domain.enumeration.Goal;
import com.yxw1268.fyp.domain.enumeration.WorkoutType;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * Computes a week of coupled nutrition and training targets, and learns from a user's logs.
 *
 * <p>Coupling runs both ways. Training drives nutrition: days with a session get the energy that
 * session costs, as carbohydrate, and protein rises with weekly training frequency. Nutrition
 * drives training: in a calorie deficit sets are cut because recovery is limited, in a surplus
 * they are added.
 *
 * <p>Adaptation closes the loop each week: the weight trend corrects the estimate of the user's
 * maintenance calories, and the share of sessions actually completed moves the training load.
 *
 * <p>Everything here is a pure function of its arguments.
 */
public final class PlanEngine {

    static final double KCAL_PER_KG = 7700;

    /** How much of an observed weight-trend error is corrected per week. */
    static final double ADAPTATION_GAIN = 0.5;
    static final int MAX_WEEKLY_CALORIE_STEP = 150;
    static final int MAX_CALORIE_ADJUSTMENT = 500;
    /** Corrections smaller than this are measurement noise. */
    static final int MIN_CALORIE_STEP = 25;

    // The weight trend is read from the weigh-ins of the last TREND_WINDOW_DAYS only, and only when
    // there are at least MIN_WEIGH_INS of them with the first and last at least MIN_TREND_SPAN_DAYS
    // apart. Day-to-day weight swings by around half a kilo, so anything less can't tell a trend
    // of a few hundred grams a week from noise.
    static final int TREND_WINDOW_DAYS = 28;
    static final int MIN_WEIGH_INS = 6;
    static final int MIN_TREND_SPAN_DAYS = 14;
    /** A plan must have been followed about a week before its results say anything. */
    static final Duration MIN_PLAN_AGE = Duration.ofDays(6);

    static final int MIN_TRAINING_OFFSET = -3;

    /** This many tired or stressed days in a week make the next week a lighter one. */
    static final int RUN_DOWN_DAYS_FOR_RECOVERY = 3;

    private static final String REST = "Rest";

    // Index 0 = Sunday. These must stay in step with the session routines in the app.
    private static final String[][] SCHEDULES = {
        { REST, "FullBody", REST, "FullBody", REST, "FullBody", REST },
        { REST, "Upper", "Lower", "Upper", "Lower", REST, REST },
        { REST, "Push", "Pull", "Legs", "Push", "Pull", REST },
    };
    private static final WorkoutType[] WORKOUT_TYPES = { WorkoutType.FBW, WorkoutType.UPPER_LOWER, WorkoutType.PPL };

    private PlanEngine() {}

    // ------------------------------------------------------------------ building a plan

    public static PlanTargets build(PlanInput input, AdaptiveState state) {
        return build(input, state, null);
    }

    /**
     * @param constraint what the user asked for this week only, or null
     */
    public static PlanTargets build(PlanInput input, AdaptiveState state, WeekConstraint constraint) {
        List<String> reasons = new ArrayList<>(state.reasons());

        // --- energy
        double bmr = bmr(input);
        int formulaMaintenance = (int) Math.round(bmr * activityFactor(input));
        int adjustment = clamp(state.calorieAdjustmentKcal(), -MAX_CALORIE_ADJUSTMENT, MAX_CALORIE_ADJUSTMENT);
        int maintenance = formulaMaintenance + adjustment;

        double target =
            switch (input.goal()) {
                case LOSE -> maintenance - Math.min(0.20 * maintenance, 500);
                case GAIN -> maintenance + Math.min(0.10 * maintenance, 300);
                default -> maintenance;
            };
        double floor = Math.max(bmr, input.male() ? 1500 : 1200);
        if (target < floor) {
            target = floor;
            reasons.add("Your calorie target is held at a safe minimum rather than cut further.");
        }

        // --- training programme
        int baseLevel =
            switch (input.activityLevel()) {
                case SEDENTARY, LIGHT -> 0;
                case MODERATE -> 1;
                default -> 2;
            };
        if (input.age() >= 65) {
            baseLevel = 0;
        } else if (input.age() >= 55) {
            baseLevel = Math.min(baseLevel, 1);
        }
        int offset = clamp(state.trainingOffset(), MIN_TRAINING_OFFSET, 0);
        int level = Math.max(0, baseLevel + offset);
        String[] schedule = applyConstraint(SCHEDULES[level], constraint, reasons);
        int sessions = (int) java.util.Arrays.stream(schedule).filter(s -> !REST.equals(s)).count();

        // nutrition -> training: energy availability sets how much volume can be recovered from
        double intensity = 0.5;
        if (input.goal() == Goal.LOSE) {
            intensity -= 0.3;
            reasons.add("You are eating below maintenance, which limits recovery, so each exercise has fewer sets.");
        } else if (input.goal() == Goal.GAIN) {
            intensity += 0.25;
            reasons.add("You are eating above maintenance, which supports extra work, so each exercise has more sets.");
        }
        if (input.age() >= 50) {
            intensity -= 0.1;
        }
        if (baseLevel + offset < 0) {
            intensity -= 0.2;
        }
        if (state.recoveryWeek()) {
            intensity -= 0.2;
        }
        intensity = Math.max(0.1, Math.min(0.9, intensity));

        // --- training -> nutrition: a training day gets what its session costs, taken from rest days
        int sessionKcal = (int) Math.round(4.5 * input.weightKg() * (0.75 + 0.5 * intensity));
        int restDays = 7 - sessions;
        double trainingCalories = target + sessionKcal * restDays / 7.0;
        double restCalories = target - sessionKcal * sessions / 7.0;
        if (sessions > 0 && restCalories < floor) {
            restCalories = floor;
            trainingCalories = (7 * target - restDays * restCalories) / sessions;
        }
        if (sessions > 0) {
            int dayDifference = (int) Math.round(trainingCalories - restCalories);
            reasons.add(
                String.format(
                    Locale.ROOT,
                    "Training days have about %d kcal more than rest days, as carbohydrate, to fuel and recover from the session.",
                    roundTo(dayDifference, 10)
                )
            );
        }

        // --- macros
        double referenceWeight = Math.min(input.weightKg(), 27 * Math.pow(input.heightCm() / 100, 2));
        double proteinPerKg =
            switch (input.goal()) {
                case LOSE -> 2.0;
                case GAIN -> 1.8;
                default -> 1.6;
            };
        if (input.dietPref() == DietPref.HIGH_PROTEIN) {
            proteinPerKg += 0.2;
        }
        if (sessions >= 5) {
            proteinPerKg += 0.2;
        } else if (sessions == 4) {
            proteinPerKg += 0.1;
        }
        proteinPerKg = Math.min(proteinPerKg, 2.4);
        double protein = Math.min(referenceWeight * proteinPerKg, 0.35 * restCalories / 4);
        reasons.add(
            String.format(
                Locale.ROOT,
                "Protein is set at %.1f g per kg for your goal and %d training sessions a week.",
                protein / referenceWeight,
                sessions
            )
        );

        double fat = Math.max(0.28 * target / 9, 0.6 * referenceWeight);

        List<DayTarget> days = new ArrayList<>();
        double carbsTotal = 0;
        for (int day = 0; day < 7; day++) {
            boolean training = !REST.equals(schedule[day]);
            double calories = training ? trainingCalories : restCalories;
            double carbs = Math.max(0, (calories - 4 * protein - 9 * fat) / 4);
            carbsTotal += carbs;
            days.add(
                new DayTarget(
                    day,
                    training,
                    schedule[day],
                    roundTo((int) Math.round(calories), 10),
                    (int) Math.round(protein),
                    (int) Math.round(carbs),
                    (int) Math.round(fat)
                )
            );
        }

        PlanDetails details = new PlanDetails(
            formulaMaintenance,
            maintenance,
            adjustment,
            offset,
            sessions,
            sessionKcal,
            List.copyOf(days),
            List.copyOf(reasons),
            state.recoveryWeek(),
            constraint == null || constraint.isEmpty() ? null : constraint
        );
        return new PlanTargets(
            roundTo((int) Math.round(target), 10),
            round1(protein),
            round1(carbsTotal / 7),
            round1(fat),
            WORKOUT_TYPES[level],
            Math.round(intensity * 100) / 100.0,
            details
        );
    }

    /**
     * The week's schedule after leaving out a body area and capping the number of sessions.
     * Sessions are dropped from the end of the week, which keeps a split's sessions in order.
     */
    private static String[] applyConstraint(String[] base, WeekConstraint constraint, List<String> reasons) {
        String[] schedule = base.clone();
        if (constraint == null || constraint.isEmpty()) {
            return schedule;
        }

        if (WeekConstraint.LOWER.equals(constraint.avoid()) || WeekConstraint.UPPER.equals(constraint.avoid())) {
            boolean avoidLower = WeekConstraint.LOWER.equals(constraint.avoid());
            List<String> dropped = avoidLower ? List.of("Legs", "Lower") : List.of("Push", "Pull", "Upper");
            for (int day = 0; day < schedule.length; day++) {
                if (dropped.contains(schedule[day])) {
                    schedule[day] = REST;
                } else if ("FullBody".equals(schedule[day])) {
                    schedule[day] = avoidLower ? "Upper" : "Lower";
                }
            }
            reasons.add(String.format(Locale.ROOT, "This week only, as you asked: no %s-body training.", avoidLower ? "lower" : "upper"));
        }

        if (constraint.maxSessions() != null) {
            int allowed = Math.max(0, constraint.maxSessions());
            int kept = 0;
            for (int day = 0; day < schedule.length; day++) {
                if (!REST.equals(schedule[day]) && ++kept > allowed) {
                    schedule[day] = REST;
                }
            }
            if (kept > allowed) {
                reasons.add(String.format(Locale.ROOT, "This week only, as you asked: %d training session%s.", allowed, allowed == 1 ? "" : "s"));
            }
        }
        return schedule;
    }

    /** Mifflin-St Jeor resting energy expenditure. */
    static double bmr(PlanInput input) {
        return 10 * input.weightKg() + 6.25 * input.heightCm() - 5 * input.age() + (input.male() ? 5 : -161);
    }

    private static double activityFactor(PlanInput input) {
        return switch (input.activityLevel()) {
            case SEDENTARY -> 1.2;
            case LIGHT -> 1.375;
            case MODERATE -> 1.55;
            case ACTIVE -> 1.725;
            case VERY_ACTIVE -> 1.9;
        };
    }

    // ------------------------------------------------------------------ learning from logs

    /**
     * Update what is known about a user from how the previous plan went.
     *
     * @param previous the details of the plan that was being followed
     * @param previousCalories that plan's average daily calorie target
     * @param previousCreatedAt when that plan was created
     * @param logs the user's tracking entries, any order
     */
    public static AdaptiveState adapt(PlanDetails previous, int previousCalories, Instant previousCreatedAt, List<LogEntry> logs, Instant now) {
        int adjustment = previous.calorieAdjustmentKcal();
        int offset = previous.trainingOffset();

        if (!hasRunItsWeek(previousCreatedAt, now)) {
            // Regenerated mid-week: nothing new to learn yet, keep what we know.
            return new AdaptiveState(adjustment, offset, previous.recoveryWeek(), List.of());
        }

        List<String> reasons = new ArrayList<>();
        LocalDate today = LocalDate.ofInstant(now, java.time.ZoneOffset.UTC);

        // --- weight trend corrects the maintenance estimate
        Double observed = weeklyWeightTrend(logs, today);
        if (observed != null) {
            double expected = (previousCalories - previous.maintenanceKcal()) * 7 / KCAL_PER_KG;
            double error = observed - expected;
            // Losing faster than the plan predicts means real maintenance is higher than assumed, and vice versa.
            int step = clamp(
                (int) Math.round(-error * KCAL_PER_KG / 7 * ADAPTATION_GAIN),
                -MAX_WEEKLY_CALORIE_STEP,
                MAX_WEEKLY_CALORIE_STEP
            );
            int updated = clamp(adjustment + step, -MAX_CALORIE_ADJUSTMENT, MAX_CALORIE_ADJUSTMENT);
            if (Math.abs(step) >= MIN_CALORIE_STEP && updated != adjustment) {
                int applied = updated - adjustment;
                reasons.add(
                    String.format(
                        Locale.ROOT,
                        "Your weight has been changing by %+.2f kg a week where the plan expected %+.2f, so your estimated maintenance was %s by %d kcal.",
                        observed,
                        expected,
                        applied > 0 ? "raised" : "lowered",
                        Math.abs(applied)
                    )
                );
                adjustment = updated;
            }
        }

        // --- completed sessions move the training load
        boolean tracksWorkouts = logs.stream().anyMatch(l -> l.completedWorkout() && !l.date().isBefore(today.minusDays(TREND_WINDOW_DAYS)));
        if (tracksWorkouts && previous.sessionsPerWeek() > 0) {
            long completed = logs
                .stream()
                .filter(l -> l.completedWorkout() && l.date().isAfter(today.minusDays(7)) && !l.date().isAfter(today))
                .count();
            double rate = (double) completed / previous.sessionsPerWeek();
            if (rate < 0.5 && offset > MIN_TRAINING_OFFSET) {
                offset--;
                reasons.add(
                    String.format(
                        Locale.ROOT,
                        "You completed %d of %d planned sessions last week, so this week's training is lighter and easier to fit in.",
                        completed,
                        previous.sessionsPerWeek()
                    )
                );
            } else if (rate >= 1.0 && offset < 0) {
                offset++;
                reasons.add("You completed every planned session last week, so your training steps back up.");
            }
        }

        // --- feeling run down on several days calls for a lighter week
        long runDownDays = logs.stream().filter(l -> l.runDown() && l.date().isAfter(today.minusDays(7)) && !l.date().isAfter(today)).count();
        boolean recoveryWeek = runDownDays >= RUN_DOWN_DAYS_FOR_RECOVERY;
        if (recoveryWeek) {
            reasons.add(
                String.format(
                    Locale.ROOT,
                    "You felt tired or stressed on %d days last week, so this week's sessions have fewer sets to help you recover.",
                    runDownDays
                )
            );
        }

        return new AdaptiveState(adjustment, offset, recoveryWeek, List.copyOf(reasons));
    }

    /**
     * Whether a plan has been followed long enough for its results to mean something.
     */
    public static boolean hasRunItsWeek(Instant createdAt, Instant now) {
        return Duration.between(createdAt, now).compareTo(MIN_PLAN_AGE) >= 0;
    }

    /**
     * What the user logged over the last seven days, against what the plan asked for.
     */
    public static WeekSummary summarize(PlanDetails previous, List<LogEntry> logs, Instant now) {
        LocalDate today = LocalDate.ofInstant(now, java.time.ZoneOffset.UTC);
        List<LogEntry> lastWeek = logs.stream().filter(l -> l.date().isAfter(today.minusDays(7)) && !l.date().isAfter(today)).toList();
        return new WeekSummary(
            (int) lastWeek.stream().filter(LogEntry::completedWorkout).count(),
            previous.sessionsPerWeek(),
            (int) lastWeek.stream().filter(l -> l.weightKg() != null).count(),
            weeklyWeightTrend(logs, today)
        );
    }

    /**
     * Least-squares weight trend in kg per week over the recent window, or null when there are
     * too few weigh-ins, or they are too close together, to tell a trend from daily fluctuation.
     */
    static Double weeklyWeightTrend(List<LogEntry> logs, LocalDate today) {
        List<LogEntry> points = logs
            .stream()
            .filter(l -> l.weightKg() != null && !l.date().isBefore(today.minusDays(TREND_WINDOW_DAYS)) && !l.date().isAfter(today))
            .sorted(Comparator.comparing(LogEntry::date))
            .toList();
        if (points.size() < MIN_WEIGH_INS) {
            return null;
        }
        LocalDate first = points.get(0).date();
        if (ChronoUnit.DAYS.between(first, points.get(points.size() - 1).date()) < MIN_TREND_SPAN_DAYS) {
            return null;
        }

        double meanX = 0;
        double meanY = 0;
        for (LogEntry p : points) {
            meanX += ChronoUnit.DAYS.between(first, p.date());
            meanY += p.weightKg();
        }
        meanX /= points.size();
        meanY /= points.size();

        double sxy = 0;
        double sxx = 0;
        for (LogEntry p : points) {
            double dx = ChronoUnit.DAYS.between(first, p.date()) - meanX;
            sxy += dx * (p.weightKg() - meanY);
            sxx += dx * dx;
        }
        return sxx == 0 ? null : sxy / sxx * 7;
    }

    // ------------------------------------------------------------------ helpers

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private static int roundTo(int value, int step) {
        return Math.round((float) value / step) * step;
    }

    private static double round1(double value) {
        return Math.round(value * 10) / 10.0;
    }
}
