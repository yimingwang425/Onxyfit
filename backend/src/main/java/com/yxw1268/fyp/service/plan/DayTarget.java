package com.yxw1268.fyp.service.plan;

/**
 * Targets for one day of the week.
 *
 * @param day 0 = Sunday ... 6 = Saturday
 * @param session the training session of the day ("Push", "Upper", "FullBody", ...) or "Rest"
 */
public record DayTarget(int day, boolean training, String session, int calories, int proteinG, int carbsG, int fatG) {}
