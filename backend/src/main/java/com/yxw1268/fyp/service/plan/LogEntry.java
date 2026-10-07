package com.yxw1268.fyp.service.plan;

import java.time.LocalDate;

/**
 * One day of user tracking.
 *
 * @param weightKg the weight logged that day, or null
 * @param mood how the user said they felt ("Energetic", "Neutral", "Tired", "Stressed"), or null
 */
public record LogEntry(LocalDate date, Double weightKg, boolean completedWorkout, String mood) {
    public LogEntry(LocalDate date, Double weightKg, boolean completedWorkout) {
        this(date, weightKg, completedWorkout, null);
    }

    /** The user said they felt tired or stressed that day. */
    public boolean runDown() {
        return "Tired".equals(mood) || "Stressed".equals(mood);
    }
}
