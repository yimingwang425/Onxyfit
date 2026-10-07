package com.yxw1268.fyp.service.plan;

/**
 * What a user logged during the week a plan was followed.
 *
 * @param weightTrendKgPerWeek the recent weight trend, or null when there are too few weigh-ins to tell
 */
public record WeekSummary(int sessionsCompleted, int sessionsPlanned, int weighIns, Double weightTrendKgPerWeek) {}
