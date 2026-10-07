package com.yxw1268.fyp.service.plan;

import java.time.LocalDate;

/**
 * One day of user tracking.
 *
 * @param weightKg the weight logged that day, or null
 */
public record LogEntry(LocalDate date, Double weightKg, boolean completedWorkout) {}
