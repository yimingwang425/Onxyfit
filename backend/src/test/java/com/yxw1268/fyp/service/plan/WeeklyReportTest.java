package com.yxw1268.fyp.service.plan;

import static org.assertj.core.api.Assertions.assertThat;

import com.yxw1268.fyp.domain.enumeration.ActivityLevel;
import com.yxw1268.fyp.domain.enumeration.DietPref;
import com.yxw1268.fyp.domain.enumeration.Goal;
import java.util.List;
import org.junit.jupiter.api.Test;

class WeeklyReportTest {

    // 2740 kcal, upper/lower split, 4 sessions
    private static final PlanTargets THIS_WEEK = PlanEngine.build(
        new PlanInput(30, 178, 80, true, ActivityLevel.MODERATE, Goal.MAINTAIN, DietPref.BALANCED),
        AdaptiveState.INITIAL
    );

    private static final String THIS_WEEK_LINE = "This week: about 2740 kcal a day and 4 workouts.";

    @Test
    void nothingLogged() {
        assertThat(WeeklyReport.compose(new WeekSummary(0, 4, 0, null), List.of(), THIS_WEEK))
            .startsWith("No check-ins last week")
            .endsWith(THIS_WEEK_LINE)
            .doesNotContain("completed")
            .doesNotContain("unchanged");
    }

    @Test
    void workoutsAndATrendWithNoChange() {
        assertThat(WeeklyReport.compose(new WeekSummary(3, 4, 2, -0.42), List.of(), THIS_WEEK)).isEqualTo(
            "Last week you completed 3 of 4 planned workouts. Your weight is trending down about 0.4 kg a week. " +
            "Your plan carries on unchanged. " +
            THIS_WEEK_LINE
        );
    }

    @Test
    void changesReplaceTheUnchangedLine() {
        String report = WeeklyReport.compose(new WeekSummary(1, 4, 3, 0.31), List.of("Calories went down.", "Training got lighter."), THIS_WEEK);
        assertThat(report)
            .contains("Your weight is trending up about 0.3 kg a week. Calories went down. Training got lighter. This week")
            .doesNotContain("unchanged");
    }

    @Test
    void steadyWeightIsNotCalledATrend() {
        assertThat(WeeklyReport.compose(new WeekSummary(0, 4, 3, 0.02), List.of(), THIS_WEEK))
            .startsWith("Your weight is holding steady.")
            .doesNotContain("completed");
    }

    @Test
    void weighInsWithoutEnoughForATrendGetEncouragement() {
        assertThat(WeeklyReport.compose(new WeekSummary(2, 4, 1, null), List.of(), THIS_WEEK))
            .contains("Last week you completed 2 of 4 planned workouts. Keep logging your weight")
            .doesNotContain("trending");
    }

    @Test
    void aChangeIsReportedEvenWithoutWorkoutsOrWeighIns() {
        assertThat(WeeklyReport.compose(new WeekSummary(0, 4, 0, null), List.of("This week is lighter."), THIS_WEEK))
            .isEqualTo("This week is lighter. " + THIS_WEEK_LINE);
    }
}
