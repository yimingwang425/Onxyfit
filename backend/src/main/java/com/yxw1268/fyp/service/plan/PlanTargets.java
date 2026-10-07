package com.yxw1268.fyp.service.plan;

import com.yxw1268.fyp.domain.enumeration.WorkoutType;

/**
 * A computed plan: weekly averages, the training programme and the per-day breakdown.
 *
 * @param workoutIntensity 0..1, how much volume each session carries
 */
public record PlanTargets(
    int caloriesKcal,
    double proteinG,
    double carbsG,
    double fatG,
    WorkoutType workoutType,
    double workoutIntensity,
    PlanDetails details
) {}
