package com.yxw1268.fyp.service.plan;

import java.util.List;

/**
 * What has been learned about one user from their logs.
 *
 * @param calorieAdjustmentKcal correction to the formula's maintenance calories
 * @param trainingOffset steps (zero or negative) the training load is held below the default
 * @param recoveryWeek the user reported being tired or stressed on several days, so this week is lighter
 * @param reasons explanations of the changes made in the latest update
 */
public record AdaptiveState(int calorieAdjustmentKcal, int trainingOffset, boolean recoveryWeek, List<String> reasons) {
    public static final AdaptiveState INITIAL = new AdaptiveState(0, 0, false, List.of());

    public AdaptiveState(int calorieAdjustmentKcal, int trainingOffset, List<String> reasons) {
        this(calorieAdjustmentKcal, trainingOffset, false, reasons);
    }
}
