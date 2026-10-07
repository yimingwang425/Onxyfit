package com.yxw1268.fyp.service.plan;

import com.yxw1268.fyp.domain.enumeration.ActivityLevel;
import com.yxw1268.fyp.domain.enumeration.DietPref;
import com.yxw1268.fyp.domain.enumeration.Goal;

/**
 * The parts of a user profile the plan is computed from.
 */
public record PlanInput(int age, double heightCm, double weightKg, boolean male, ActivityLevel activityLevel, Goal goal, DietPref dietPref) {}
