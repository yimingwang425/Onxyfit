package com.yxw1268.fyp.service.plan;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

/**
 * Everything a plan was built from, stored with the plan as JSON. Besides the per-day targets shown
 * to the user it carries the adaptive state, so next week's plan can continue from it.
 *
 * @param formulaMaintenanceKcal maintenance calories from the population formula alone
 * @param maintenanceKcal maintenance calories actually used (formula + what was learned about this user)
 * @param calorieAdjustmentKcal the learned correction to the formula
 * @param trainingOffset steps the training load was moved down from the default because sessions were missed
 * @param reasons plain-language explanations of how the plan was derived and why it changed
 * @param recoveryWeek whether volume is reduced this week because the user reported being run down
 * @param weekConstraint what the user asked for this week only, or null
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record PlanDetails(
    int formulaMaintenanceKcal,
    int maintenanceKcal,
    int calorieAdjustmentKcal,
    int trainingOffset,
    int sessionsPerWeek,
    int sessionKcal,
    List<DayTarget> days,
    List<String> reasons,
    boolean recoveryWeek,
    WeekConstraint weekConstraint
) {}
