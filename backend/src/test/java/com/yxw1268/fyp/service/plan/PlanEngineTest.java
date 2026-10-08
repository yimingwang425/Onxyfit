package com.yxw1268.fyp.service.plan;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import com.yxw1268.fyp.domain.enumeration.ActivityLevel;
import com.yxw1268.fyp.domain.enumeration.DietPref;
import com.yxw1268.fyp.domain.enumeration.Goal;
import com.yxw1268.fyp.domain.enumeration.WorkoutType;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class PlanEngineTest {

    private static final Instant NOW = Instant.parse("2026-10-11T00:00:00Z");
    private static final LocalDate TODAY = LocalDate.ofInstant(NOW, ZoneOffset.UTC);

    private static PlanInput person(Goal goal, ActivityLevel activity) {
        return new PlanInput(30, 178, 80, true, activity, goal, DietPref.BALANCED);
    }

    private static PlanTargets build(Goal goal, ActivityLevel activity) {
        return PlanEngine.build(person(goal, activity), AdaptiveState.INITIAL);
    }

    // ------------------------------------------------------------------ building

    @Test
    void maintenanceComesFromMifflinStJeor() {
        // 10*80 + 6.25*178 - 5*30 + 5 = 1767.5, x1.55
        PlanTargets plan = build(Goal.MAINTAIN, ActivityLevel.MODERATE);
        assertThat(plan.details().formulaMaintenanceKcal()).isEqualTo(2740);
        assertThat(plan.caloriesKcal()).isEqualTo(2740);

        PlanInput woman = new PlanInput(30, 165, 60, false, ActivityLevel.SEDENTARY, Goal.MAINTAIN, DietPref.BALANCED);
        // 600 + 1031.25 - 150 - 161 = 1320.25, x1.2
        assertThat(PlanEngine.build(woman, AdaptiveState.INITIAL).details().formulaMaintenanceKcal()).isEqualTo(1584);
    }

    @Test
    void goalMovesCaloriesWithinLimits() {
        int maintain = build(Goal.MAINTAIN, ActivityLevel.MODERATE).caloriesKcal();
        assertThat(build(Goal.LOSE, ActivityLevel.MODERATE).caloriesKcal()).isEqualTo(maintain - 500);
        assertThat(build(Goal.GAIN, ActivityLevel.MODERATE).caloriesKcal()).isCloseTo(maintain + 274, within(6));
    }

    @Test
    void caloriesNeverGoBelowTheSafeFloor() {
        PlanInput small = new PlanInput(45, 152, 48, false, ActivityLevel.SEDENTARY, Goal.LOSE, DietPref.BALANCED);
        PlanTargets plan = PlanEngine.build(small, new AdaptiveState(-500, 0, List.of()));
        assertThat(plan.caloriesKcal()).isGreaterThanOrEqualTo(1200);
        assertThat(plan.details().days()).allSatisfy(day -> assertThat(day.calories()).isGreaterThanOrEqualTo(1195));
        assertThat(plan.details().reasons()).anyMatch(r -> r.contains("safe minimum"));
    }

    @Test
    void trainingDaysGetTheSessionCostAndTheWeekStillAveragesToTheTarget() {
        PlanTargets plan = build(Goal.MAINTAIN, ActivityLevel.ACTIVE);
        List<DayTarget> days = plan.details().days();
        DayTarget training = days.stream().filter(DayTarget::training).findFirst().orElseThrow();
        DayTarget rest = days.stream().filter(d -> !d.training()).findFirst().orElseThrow();

        assertThat(training.calories() - rest.calories()).isCloseTo(plan.details().sessionKcal(), within(10));
        // the difference is carbohydrate; protein and fat stay put
        assertThat(training.proteinG()).isEqualTo(rest.proteinG());
        assertThat(training.fatG()).isEqualTo(rest.fatG());
        assertThat((training.carbsG() - rest.carbsG()) * 4).isCloseTo(plan.details().sessionKcal(), within(12));

        double weeklyMean = days.stream().mapToInt(DayTarget::calories).average().orElseThrow();
        assertThat(weeklyMean).isCloseTo(plan.caloriesKcal(), within(10.0));
    }

    @Test
    void macrosAddUpToTheDayCalories() {
        for (Goal goal : Goal.values()) {
            for (ActivityLevel activity : ActivityLevel.values()) {
                for (DayTarget day : build(goal, activity).details().days()) {
                    int fromMacros = day.proteinG() * 4 + day.carbsG() * 4 + day.fatG() * 9;
                    assertThat(fromMacros).as("%s %s day %d", goal, activity, day.day()).isCloseTo(day.calories(), within(15));
                    assertThat(day.carbsG()).isPositive();
                }
            }
        }
    }

    @Test
    void programmeFollowsActivityLevelAndAge() {
        assertThat(build(Goal.MAINTAIN, ActivityLevel.SEDENTARY).workoutType()).isEqualTo(WorkoutType.FBW);
        assertThat(build(Goal.MAINTAIN, ActivityLevel.MODERATE).workoutType()).isEqualTo(WorkoutType.UPPER_LOWER);
        assertThat(build(Goal.MAINTAIN, ActivityLevel.VERY_ACTIVE).workoutType()).isEqualTo(WorkoutType.PPL);
        assertThat(build(Goal.MAINTAIN, ActivityLevel.VERY_ACTIVE).details().sessionsPerWeek()).isEqualTo(5);

        PlanInput older = new PlanInput(67, 178, 80, true, ActivityLevel.VERY_ACTIVE, Goal.MAINTAIN, DietPref.BALANCED);
        assertThat(PlanEngine.build(older, AdaptiveState.INITIAL).workoutType()).isEqualTo(WorkoutType.FBW);
    }

    @Test
    void energyBalanceSetsTrainingVolume() {
        double lose = build(Goal.LOSE, ActivityLevel.MODERATE).workoutIntensity();
        double maintain = build(Goal.MAINTAIN, ActivityLevel.MODERATE).workoutIntensity();
        double gain = build(Goal.GAIN, ActivityLevel.MODERATE).workoutIntensity();
        assertThat(lose).isLessThan(maintain);
        assertThat(maintain).isLessThan(gain);
        // the app adds round(intensity * 2) sets per exercise
        assertThat(Math.round(lose * 2)).isZero();
        assertThat(Math.round(maintain * 2)).isEqualTo(1);
        assertThat(Math.round(gain * 2)).isEqualTo(2);
    }

    @Test
    void moreSessionsMeanMoreProtein() {
        assertThat(build(Goal.MAINTAIN, ActivityLevel.VERY_ACTIVE).proteinG()).isGreaterThan(build(Goal.MAINTAIN, ActivityLevel.LIGHT).proteinG());
    }

    @Test
    void proteinDoesNotScaleWithExcessBodyWeight() {
        PlanInput heavy = new PlanInput(30, 178, 140, true, ActivityLevel.LIGHT, Goal.LOSE, DietPref.BALANCED);
        // reference weight is capped at BMI 27 = 85.5 kg, x2.0 g/kg
        assertThat(PlanEngine.build(heavy, AdaptiveState.INITIAL).proteinG()).isCloseTo(171, within(1.0));
    }

    @Test
    void learnedStateChangesThePlan() {
        PlanTargets base = build(Goal.MAINTAIN, ActivityLevel.ACTIVE);
        PlanTargets adapted = PlanEngine.build(person(Goal.MAINTAIN, ActivityLevel.ACTIVE), new AdaptiveState(-200, -1, List.of("why")));

        assertThat(adapted.caloriesKcal()).isEqualTo(base.caloriesKcal() - 200);
        assertThat(adapted.details().formulaMaintenanceKcal()).isEqualTo(base.details().formulaMaintenanceKcal());
        assertThat(adapted.workoutType()).isEqualTo(WorkoutType.UPPER_LOWER);
        assertThat(adapted.details().reasons()).contains("why");
        assertThat(adapted.details().calorieAdjustmentKcal()).isEqualTo(-200);
        assertThat(adapted.details().trainingOffset()).isEqualTo(-1);
    }

    @Test
    void lightestProgrammeStillEasesOffWhenPushedFurtherDown() {
        PlanInput input = person(Goal.MAINTAIN, ActivityLevel.SEDENTARY);
        PlanTargets base = PlanEngine.build(input, AdaptiveState.INITIAL);
        PlanTargets eased = PlanEngine.build(input, new AdaptiveState(0, -1, List.of()));
        assertThat(eased.workoutType()).isEqualTo(WorkoutType.FBW);
        assertThat(eased.workoutIntensity()).isLessThan(base.workoutIntensity());
    }

    // ------------------------------------------------------------------ adapting

    private static PlanDetails previous(Goal goal) {
        return build(goal, ActivityLevel.MODERATE).details();
    }

    /** Weigh-ins every other day for three weeks, changing by the given amount per week. */
    private static List<LogEntry> weighIns(double startKg, double kgPerWeek) {
        List<LogEntry> logs = new ArrayList<>();
        for (int daysAgo = 20; daysAgo >= 0; daysAgo -= 2) {
            logs.add(new LogEntry(TODAY.minusDays(daysAgo), startKg + kgPerWeek * (20 - daysAgo) / 7.0, false));
        }
        return logs;
    }

    private static final Instant WEEK_AGO = NOW.minus(7, ChronoUnit.DAYS);

    @Test
    void trendIsLeastSquaresSlopePerWeek() {
        assertThat(PlanEngine.weeklyWeightTrend(weighIns(80, -0.5), TODAY)).isCloseTo(-0.5, within(1e-9));
        assertThat(PlanEngine.weeklyWeightTrend(weighIns(80, 0), TODAY)).isCloseTo(0, within(1e-9));
    }

    /** Weigh-ins on the given days before today, all at 80 kg. */
    private static List<LogEntry> weighedOn(int... daysAgo) {
        return java.util.Arrays.stream(daysAgo).mapToObj(d -> new LogEntry(TODAY.minusDays(d), 80.0, false)).toList();
    }

    @Test
    void trendNeedsSixWeighInsAtLeastTwoWeeksApartWithinTheWindow() {
        // exactly at the threshold: 6 weigh-ins, first and last 14 days apart
        assertThat(PlanEngine.weeklyWeightTrend(weighedOn(14, 11, 8, 5, 2, 0), TODAY)).isNotNull();

        // one weigh-in short
        assertThat(PlanEngine.weeklyWeightTrend(weighedOn(20, 15, 10, 5, 0), TODAY)).isNull();
        // enough weigh-ins, but only 13 days from first to last
        assertThat(PlanEngine.weeklyWeightTrend(weighedOn(13, 10, 8, 5, 2, 0), TODAY)).isNull();
        // six days in a row
        assertThat(PlanEngine.weeklyWeightTrend(weighedOn(5, 4, 3, 2, 1, 0), TODAY)).isNull();
    }

    @Test
    void weighInsOlderThanTheWindowDoNotCount() {
        // plenty of history, but all of it more than 28 days old
        assertThat(PlanEngine.weeklyWeightTrend(weighedOn(60, 55, 50, 45, 40, 35, 30), TODAY)).isNull();
        // only 3 of these fall inside the window
        assertThat(PlanEngine.weeklyWeightTrend(weighedOn(60, 50, 40, 30, 20, 10, 0), TODAY)).isNull();
        // the oldest one is outside the window, leaving 6 that span 28 days down to today
        assertThat(PlanEngine.weeklyWeightTrend(weighedOn(40, 28, 22, 16, 10, 4, 0), TODAY)).isNotNull();
        // the edge of the window is inclusive, one day further is not
        assertThat(PlanEngine.weeklyWeightTrend(weighedOn(28, 6, 4, 3, 1, 0), TODAY)).isNotNull();
        assertThat(PlanEngine.weeklyWeightTrend(weighedOn(29, 6, 4, 3, 1, 0), TODAY)).isNull();
    }

    @Test
    void weightOnTrackChangesNothing() {
        PlanDetails prev = previous(Goal.LOSE);
        int calories = prev.maintenanceKcal() - 500;
        // a 500 kcal deficit predicts about -0.45 kg a week
        AdaptiveState state = PlanEngine.adapt(prev, calories, WEEK_AGO, weighIns(80, -0.4545), NOW);
        assertThat(state.calorieAdjustmentKcal()).isZero();
        assertThat(state.reasons()).isEmpty();
    }

    @Test
    void losingSlowerThanPlannedLowersTheMaintenanceEstimate() {
        PlanDetails prev = previous(Goal.LOSE);
        int calories = prev.maintenanceKcal() - 500;
        // expected -0.45, observed -0.25: +0.20 kg/week error = 225 kcal/day, a quarter corrected per week
        AdaptiveState state = PlanEngine.adapt(prev, calories, WEEK_AGO, weighIns(80, -0.25), NOW);
        assertThat(state.calorieAdjustmentKcal()).isCloseTo(-56, within(2));
        assertThat(state.reasons()).singleElement().asString().contains("lowered");
    }

    @Test
    void losingFasterThanPlannedRaisesIt() {
        PlanDetails prev = previous(Goal.MAINTAIN);
        AdaptiveState state = PlanEngine.adapt(prev, prev.maintenanceKcal(), WEEK_AGO, weighIns(80, -0.2), NOW);
        // -0.2 kg/week where none was expected = 220 kcal/day, a quarter corrected
        assertThat(state.calorieAdjustmentKcal()).isCloseTo(55, within(2));
        assertThat(state.reasons()).singleElement().asString().contains("raised");
    }

    @Test
    void correctionsAreBoundedPerWeekAndInTotal() {
        PlanDetails prev = previous(Goal.MAINTAIN);
        // a wild reading: -3 kg a week
        AdaptiveState once = PlanEngine.adapt(prev, prev.maintenanceKcal(), WEEK_AGO, weighIns(80, -3), NOW);
        assertThat(once.calorieAdjustmentKcal()).isEqualTo(PlanEngine.MAX_WEEKLY_CALORIE_STEP);

        PlanDetails nearLimit = PlanEngine.build(person(Goal.MAINTAIN, ActivityLevel.MODERATE), new AdaptiveState(450, 0, List.of())).details();
        AdaptiveState capped = PlanEngine.adapt(nearLimit, nearLimit.maintenanceKcal(), WEEK_AGO, weighIns(80, -3), NOW);
        assertThat(capped.calorieAdjustmentKcal()).isEqualTo(PlanEngine.MAX_CALORIE_ADJUSTMENT);
    }

    @Test
    void nothingIsLearnedFromAPlanThatHasBarelyStarted() {
        PlanDetails prev = PlanEngine.build(person(Goal.MAINTAIN, ActivityLevel.MODERATE), new AdaptiveState(100, -1, List.of())).details();
        AdaptiveState state = PlanEngine.adapt(prev, prev.maintenanceKcal(), NOW.minus(2, ChronoUnit.DAYS), weighIns(80, -3), NOW);
        assertThat(state.calorieAdjustmentKcal()).isEqualTo(100);
        assertThat(state.trainingOffset()).isEqualTo(-1);
        assertThat(state.reasons()).isEmpty();
    }

    @Test
    void withoutLogsNothingChanges() {
        PlanDetails prev = previous(Goal.LOSE);
        AdaptiveState state = PlanEngine.adapt(prev, prev.maintenanceKcal() - 500, WEEK_AGO, List.of(), NOW);
        assertThat(state.calorieAdjustmentKcal()).isZero();
        assertThat(state.trainingOffset()).isZero();
        assertThat(state.reasons()).isEmpty();
    }

    private static List<LogEntry> sessionsThisWeek(int count) {
        List<LogEntry> logs = new ArrayList<>();
        // an older completed session shows the user does track workouts
        logs.add(new LogEntry(TODAY.minusDays(12), null, true));
        for (int i = 0; i < count; i++) {
            logs.add(new LogEntry(TODAY.minusDays(i + 1), null, true));
        }
        return logs;
    }

    @Test
    void missingMostSessionsLightensTraining() {
        PlanDetails prev = previous(Goal.MAINTAIN); // 4 sessions
        AdaptiveState state = PlanEngine.adapt(prev, prev.maintenanceKcal(), WEEK_AGO, sessionsThisWeek(1), NOW);
        assertThat(state.trainingOffset()).isEqualTo(-1);
        assertThat(state.reasons()).singleElement().asString().contains("1 of 4");
    }

    @Test
    void completingHalfOrMoreKeepsTrainingAsIs() {
        PlanDetails prev = previous(Goal.MAINTAIN);
        assertThat(PlanEngine.adapt(prev, prev.maintenanceKcal(), WEEK_AGO, sessionsThisWeek(2), NOW).trainingOffset()).isZero();
    }

    @Test
    void completingEverythingStepsBackUpButNeverAboveTheDefault() {
        PlanDetails lightened = PlanEngine.build(person(Goal.MAINTAIN, ActivityLevel.ACTIVE), new AdaptiveState(0, -1, List.of())).details();
        AdaptiveState up = PlanEngine.adapt(lightened, lightened.maintenanceKcal(), WEEK_AGO, sessionsThisWeek(4), NOW);
        assertThat(up.trainingOffset()).isZero();

        PlanDetails prev = previous(Goal.MAINTAIN);
        assertThat(PlanEngine.adapt(prev, prev.maintenanceKcal(), WEEK_AGO, sessionsThisWeek(4), NOW).trainingOffset()).isZero();
    }

    @Test
    void someoneWhoNeverLogsWorkoutsIsNotAssumedToHaveSkippedThem() {
        PlanDetails prev = previous(Goal.MAINTAIN);
        // weigh-ins only, no workout ever marked complete
        AdaptiveState state = PlanEngine.adapt(prev, prev.maintenanceKcal(), WEEK_AGO, weighIns(80, 0), NOW);
        assertThat(state.trainingOffset()).isZero();
    }

    // ------------------------------------------------------------------ feeling run down

    private static List<LogEntry> moods(String... lastDays) {
        List<LogEntry> logs = new ArrayList<>();
        for (int i = 0; i < lastDays.length; i++) {
            logs.add(new LogEntry(TODAY.minusDays(i + 1), null, false, lastDays[i]));
        }
        return logs;
    }

    @Test
    void severalRunDownDaysMakeALighterWeek() {
        PlanDetails prev = previous(Goal.MAINTAIN);
        AdaptiveState state = PlanEngine.adapt(prev, prev.maintenanceKcal(), WEEK_AGO, moods("Tired", "Neutral", "Stressed", "Tired"), NOW);
        assertThat(state.recoveryWeek()).isTrue();
        assertThat(state.reasons()).singleElement().asString().contains("tired or stressed on 3 days");

        PlanInput input = person(Goal.MAINTAIN, ActivityLevel.MODERATE);
        PlanTargets lighter = PlanEngine.build(input, state);
        assertThat(lighter.workoutIntensity()).isLessThan(PlanEngine.build(input, AdaptiveState.INITIAL).workoutIntensity());
        assertThat(lighter.details().recoveryWeek()).isTrue();
        // only volume changes: same programme, same calories
        assertThat(lighter.workoutType()).isEqualTo(WorkoutType.UPPER_LOWER);
        assertThat(lighter.caloriesKcal()).isEqualTo(2740);
    }

    @Test
    void aCoupleOfRunDownDaysOrOldOnesDoNot() {
        PlanDetails prev = previous(Goal.MAINTAIN);
        assertThat(PlanEngine.adapt(prev, prev.maintenanceKcal(), WEEK_AGO, moods("Tired", "Energetic", "Stressed"), NOW).recoveryWeek()).isFalse();

        List<LogEntry> old = List.of(
            new LogEntry(TODAY.minusDays(8), null, false, "Tired"),
            new LogEntry(TODAY.minusDays(9), null, false, "Tired"),
            new LogEntry(TODAY.minusDays(10), null, false, "Tired")
        );
        assertThat(PlanEngine.adapt(prev, prev.maintenanceKcal(), WEEK_AGO, old, NOW).recoveryWeek()).isFalse();
    }

    @Test
    void recoveryWeekEndsWhenTheUserFeelsBetterAndSurvivesAMidWeekRegeneration() {
        PlanDetails recovering = PlanEngine.build(
            person(Goal.MAINTAIN, ActivityLevel.MODERATE),
            new AdaptiveState(0, 0, true, List.of())
        ).details();

        assertThat(PlanEngine.adapt(recovering, recovering.maintenanceKcal(), NOW.minus(2, ChronoUnit.DAYS), List.of(), NOW).recoveryWeek()).isTrue();
        assertThat(PlanEngine.adapt(recovering, recovering.maintenanceKcal(), WEEK_AGO, moods("Energetic", "Neutral"), NOW).recoveryWeek()).isFalse();
    }

    // ------------------------------------------------------------------ this week only

    private static List<String> sessions(PlanTargets plan) {
        return plan.details().days().stream().map(DayTarget::session).toList();
    }

    private static PlanTargets constrained(ActivityLevel activity, Integer maxSessions, String avoid) {
        return PlanEngine.build(person(Goal.MAINTAIN, activity), AdaptiveState.INITIAL, new WeekConstraint(maxSessions, avoid));
    }

    @Test
    void sessionCapKeepsTheFirstSessionsOfTheSplit() {
        assertThat(sessions(constrained(ActivityLevel.ACTIVE, 3, null))).containsExactly("Rest", "Push", "Pull", "Legs", "Rest", "Rest", "Rest");
        assertThat(sessions(constrained(ActivityLevel.MODERATE, 2, null))).containsExactly("Rest", "Upper", "Lower", "Rest", "Rest", "Rest", "Rest");

        PlanTargets two = constrained(ActivityLevel.MODERATE, 2, null);
        assertThat(two.details().sessionsPerWeek()).isEqualTo(2);
        assertThat(two.details().weekConstraint()).isEqualTo(new WeekConstraint(2, null));
        assertThat(two.details().reasons()).anyMatch(r -> r.contains("This week only") && r.contains("2 training sessions"));
    }

    @Test
    void sessionCapAboveThePlanChangesNothing() {
        PlanTargets capped = constrained(ActivityLevel.MODERATE, 6, null);
        assertThat(sessions(capped)).isEqualTo(sessions(build(Goal.MAINTAIN, ActivityLevel.MODERATE)));
        assertThat(capped.details().reasons()).noneMatch(r -> r.contains("This week only"));
    }

    @Test
    void avoidingABodyAreaRemovesOrReplacesItsSessions() {
        assertThat(sessions(constrained(ActivityLevel.ACTIVE, null, WeekConstraint.LOWER))).containsExactly("Rest", "Push", "Pull", "Rest", "Push", "Pull", "Rest");
        assertThat(sessions(constrained(ActivityLevel.ACTIVE, null, WeekConstraint.UPPER))).containsExactly("Rest", "Rest", "Rest", "Legs", "Rest", "Rest", "Rest");
        assertThat(sessions(constrained(ActivityLevel.MODERATE, null, WeekConstraint.LOWER))).containsExactly("Rest", "Upper", "Rest", "Upper", "Rest", "Rest", "Rest");
        // full-body sessions become sessions for the other half
        assertThat(sessions(constrained(ActivityLevel.LIGHT, null, WeekConstraint.LOWER))).containsExactly("Rest", "Upper", "Rest", "Upper", "Rest", "Upper", "Rest");
        assertThat(sessions(constrained(ActivityLevel.LIGHT, null, WeekConstraint.UPPER))).containsExactly("Rest", "Lower", "Rest", "Lower", "Rest", "Lower", "Rest");
    }

    @Test
    void bothConstraintsCombine() {
        assertThat(sessions(constrained(ActivityLevel.ACTIVE, 2, WeekConstraint.LOWER))).containsExactly("Rest", "Push", "Pull", "Rest", "Rest", "Rest", "Rest");
    }

    @Test
    void nutritionFollowsTheConstrainedWeek() {
        PlanTargets normal = build(Goal.MAINTAIN, ActivityLevel.ACTIVE);
        PlanTargets two = constrained(ActivityLevel.ACTIVE, 2, null);

        // same weekly average, spread over 2 training days instead of 5, and less protein for less training
        assertThat(two.caloriesKcal()).isEqualTo(normal.caloriesKcal());
        double mean = two.details().days().stream().mapToInt(DayTarget::calories).average().orElseThrow();
        assertThat(mean).isCloseTo(two.caloriesKcal(), within(10.0));
        assertThat(two.details().days().stream().filter(DayTarget::training)).hasSize(2);
        assertThat(two.proteinG()).isLessThan(normal.proteinG());
    }

    @Test
    void aWeekWithNoSessionsIsAllRestDaysAtTheTarget() {
        PlanTargets none = constrained(ActivityLevel.ACTIVE, 0, null);
        assertThat(none.details().sessionsPerWeek()).isZero();
        assertThat(none.details().days()).allSatisfy(day -> {
            assertThat(day.training()).isFalse();
            assertThat(day.calories()).isEqualTo(none.caloriesKcal());
        });
    }

    @Test
    void anEmptyConstraintIsNoConstraint() {
        PlanTargets plan = PlanEngine.build(person(Goal.MAINTAIN, ActivityLevel.MODERATE), AdaptiveState.INITIAL, new WeekConstraint(null, null));
        assertThat(plan.details().weekConstraint()).isNull();
        assertThat(sessions(plan)).isEqualTo(sessions(build(Goal.MAINTAIN, ActivityLevel.MODERATE)));
    }
}
