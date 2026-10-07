package com.yxw1268.fyp.service.plan;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Something the user asked for that applies to the current week only.
 *
 * @param maxSessions the most training sessions they can do this week, or null
 * @param avoid a body area to leave out this week: "UPPER", "LOWER", or null
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record WeekConstraint(Integer maxSessions, String avoid) {
    public static final String UPPER = "UPPER";
    public static final String LOWER = "LOWER";

    public boolean isEmpty() {
        return maxSessions == null && avoid == null;
    }
}
