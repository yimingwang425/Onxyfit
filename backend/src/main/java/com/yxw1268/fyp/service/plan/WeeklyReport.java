package com.yxw1268.fyp.service.plan;

import java.util.List;
import java.util.Locale;

/**
 * Writes the short weekly report shown to the user: what they did last week, what it changed,
 * and what this week looks like. Every number comes straight from the plan and the logs.
 */
public final class WeeklyReport {

    private WeeklyReport() {}

    /**
     * @param changes the explanations of what adaptation changed this week, possibly empty
     */
    public static String compose(WeekSummary week, List<String> changes, PlanTargets thisWeek) {
        StringBuilder report = new StringBuilder();
        // A change can also come from something the summary doesn't count, like how the user felt
        boolean checkedIn = week.sessionsCompleted() > 0 || week.weighIns() > 0 || !changes.isEmpty();

        if (!checkedIn) {
            report.append(
                "No check-ins last week, so there was nothing new to learn from. Log your weight and workouts and your plan will adapt to you."
            );
        } else {
            if (week.sessionsCompleted() > 0) {
                report.append(
                    String.format(
                        Locale.ROOT,
                        "Last week you completed %d of %d planned workouts.",
                        week.sessionsCompleted(),
                        week.sessionsPlanned()
                    )
                );
            }
            if (week.weightTrendKgPerWeek() != null) {
                double trend = week.weightTrendKgPerWeek();
                if (Math.abs(trend) < 0.05) {
                    append(report, "Your weight is holding steady.");
                } else {
                    append(
                        report,
                        String.format(Locale.ROOT, "Your weight is trending %s about %.1f kg a week.", trend < 0 ? "down" : "up", Math.abs(trend))
                    );
                }
            } else if (week.weighIns() > 0) {
                append(report, "Keep logging your weight a few times a week: once there is enough to see a trend, your calories will adapt to it.");
            }

            if (changes.isEmpty()) {
                append(report, "Your plan carries on unchanged.");
            } else {
                changes.forEach(change -> append(report, change));
            }
        }

        append(
            report,
            String.format(
                Locale.ROOT,
                "This week: about %d kcal a day and %d workouts.",
                thisWeek.caloriesKcal(),
                thisWeek.details().sessionsPerWeek()
            )
        );
        return report.toString();
    }

    private static void append(StringBuilder report, String sentence) {
        if (report.length() > 0) {
            report.append(' ');
        }
        report.append(sentence);
    }
}
