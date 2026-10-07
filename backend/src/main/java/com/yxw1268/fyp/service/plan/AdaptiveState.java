package com.yxw1268.fyp.service.plan;

import java.util.List;

/**
 * What has been learned about one user from their logs.
 *
 * @param calorieAdjustmentKcal correction to the formula's maintenance calories
 * @param trainingOffset steps (zero or negative) the training load is held below the default
 * @param reasons explanations of the changes made in the latest update
 */
public record AdaptiveState(int calorieAdjustmentKcal, int trainingOffset, List<String> reasons) {
    public static final AdaptiveState INITIAL = new AdaptiveState(0, 0, List.of());
}
