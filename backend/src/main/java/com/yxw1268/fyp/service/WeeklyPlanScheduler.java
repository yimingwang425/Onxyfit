package com.yxw1268.fyp.service;

import com.yxw1268.fyp.domain.UserProfile;
import com.yxw1268.fyp.repository.UserProfileRepository;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class WeeklyPlanScheduler {

    private static final Logger LOG = LoggerFactory.getLogger(WeeklyPlanScheduler.class);

    private final UserProfileRepository userProfileRepository;
    private final PlanService planService;

    public WeeklyPlanScheduler(UserProfileRepository userProfileRepository, PlanService planService) {
        this.userProfileRepository = userProfileRepository;
        this.planService = planService;
    }

    /**
     * Triggered every Sunday at 00:00, it iterates through all registered users and regenerates the schedule.
     */
    @Scheduled(cron = "0 0 0 * * SUN")
    public void regenerateWeeklyPlans() {
        LOG.info("=== Weekly plan regeneration started ===");

        List<UserProfile> allProfiles = userProfileRepository.findAllWithToOneRelationships();

        int success = 0;
        int failed = 0;

        for (UserProfile profile : allProfiles) {
            if (profile.getGoal() == null || profile.getActivityLevel() == null || profile.getDietPref() == null) {
                continue;
            }

            try {
                planService.generatePlanForProfile(profile);
                success++;
            } catch (Exception e) {
                failed++;
            }
        }
    }
}