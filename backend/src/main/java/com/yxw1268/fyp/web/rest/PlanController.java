package com.yxw1268.fyp.web.rest;

import com.yxw1268.fyp.security.SecurityUtils;
import com.yxw1268.fyp.service.PlanService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for managing meal and workout plans.
 */
@RestController
@RequestMapping("/api")
public class PlanController {

    private final Logger log = LoggerFactory.getLogger(PlanController.class);
    private final PlanService planService;

    public PlanController(PlanService planService) {
        this.planService = planService;
    }

    /**
     * GET /api/meal-plan/today
     */
    @GetMapping("/meal-plan/today")
    public ResponseEntity<Map<String, Object>> getTodayMealPlan() {
        String userLogin = SecurityUtils.getCurrentUserLogin().orElse("");
        log.debug("REST request to get today's meal plan for user: {}", userLogin);
        
        Map<String, Object> plan = planService.getTodayMealPlan(userLogin);
        return ResponseEntity.ok(plan);
    }

    /**
     * GET /api/meal-plan/week
     */
    @GetMapping("/meal-plan/week")
    public ResponseEntity<List<Map<String, Object>>> getWeeklyMealPlan() {
        String userLogin = SecurityUtils.getCurrentUserLogin().orElse("");
        log.debug("REST request to get weekly meal plan for user: {}", userLogin);
        
        List<Map<String, Object>> plan = planService.getWeeklyMealPlan(userLogin);
        return ResponseEntity.ok(plan);
    }

    /**
     * GET /api/workout-plan/today
     */
    @GetMapping("/workout-plan/today")
    public ResponseEntity<Map<String, Object>> getTodayWorkoutPlan() {
        String userLogin = SecurityUtils.getCurrentUserLogin().orElse("");
        log.debug("REST request to get today's workout plan for user: {}", userLogin);
        
        Map<String, Object> plan = planService.getTodayWorkoutPlan(userLogin);
        return ResponseEntity.ok(plan);
    }

    /**
     * GET /api/workout-plan/week
     */
    @GetMapping("/workout-plan/week")
    public ResponseEntity<List<Map<String, Object>>> getWeeklyWorkoutPlan() {
        String userLogin = SecurityUtils.getCurrentUserLogin().orElse("");
        log.debug("REST request to get weekly workout plan for user: {}", userLogin);
        
        List<Map<String, Object>> plan = planService.getWeeklyWorkoutPlan(userLogin);
        return ResponseEntity.ok(plan);
    }

    /**
     * POST /api/plan/generate : Generate this week's plan (diet + exercise) for the current user
     */
    @PostMapping("/plan/generate")
    public ResponseEntity<Map<String, String>> generatePlan() {
        String userLogin = SecurityUtils.getCurrentUserLogin().orElse("");
        log.debug("REST request to generate plan for user: {}", userLogin);
        
        planService.generatePlanForUser(userLogin);
        return ResponseEntity.ok(Map.of("message", "Plan generated successfully"));
    }
}