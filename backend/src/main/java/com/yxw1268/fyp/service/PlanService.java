package com.yxw1268.fyp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yxw1268.fyp.domain.Plan;
import com.yxw1268.fyp.domain.UserProfile;
import com.yxw1268.fyp.domain.enumeration.DietPref;
import com.yxw1268.fyp.domain.enumeration.Goal;
import com.yxw1268.fyp.repository.PlanRepository;
import com.yxw1268.fyp.repository.UserProfileRepository;
import com.yxw1268.fyp.service.dto.PlanDTO;
import com.yxw1268.fyp.service.mapper.PlanMapper;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.yxw1268.fyp.domain.Plan}.
 */
@Service
@Transactional
public class PlanService {

    private static final Logger LOG = LoggerFactory.getLogger(PlanService.class);

    private final PlanRepository planRepository;
    private final PlanMapper planMapper;
    private final UserProfileRepository userProfileRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    private static final boolean USE_AI_MODEL = false; //change to ture after model was trained

    public PlanService(
        PlanRepository planRepository, 
        PlanMapper planMapper,
        UserProfileRepository userProfileRepository
    ) {
        this.planRepository = planRepository;
        this.planMapper = planMapper;
        this.userProfileRepository = userProfileRepository;
    }

    /**
     * Save a plan.
     */
    public PlanDTO save(PlanDTO planDTO) {
        LOG.debug("Request to save Plan : {}", planDTO);
        Plan plan = planMapper.toEntity(planDTO);
        plan = planRepository.save(plan);
        return planMapper.toDto(plan);
    }

    /**
     * Update a plan.
     */
    public PlanDTO update(PlanDTO planDTO) {
        LOG.debug("Request to update Plan : {}", planDTO);
        Plan plan = planMapper.toEntity(planDTO);
        plan = planRepository.save(plan);
        return planMapper.toDto(plan);
    }

    /**
     * Partially update a plan.
     */
    public Optional<PlanDTO> partialUpdate(PlanDTO planDTO) {
        LOG.debug("Request to partially update Plan : {}", planDTO);

        return planRepository
            .findById(planDTO.getId())
            .map(existingPlan -> {
                planMapper.partialUpdate(existingPlan, planDTO);
                return existingPlan;
            })
            .map(planRepository::save)
            .map(planMapper::toDto);
    }

    /**
     * Get all the plans.
     */
    @Transactional(readOnly = true)
    public Page<PlanDTO> findAll(Pageable pageable) {
        LOG.debug("Request to get all Plans");
        return planRepository.findAll(pageable).map(planMapper::toDto);
    }

    /**
     * Get one plan by id.
     */
    @Transactional(readOnly = true)
    public Optional<PlanDTO> findOne(Long id) {
        LOG.debug("Request to get Plan : {}", id);
        return planRepository.findById(id).map(planMapper::toDto);
    }

    /**
     * Delete the plan by id.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete Plan : {}", id);
        planRepository.deleteById(id);
    }

    // meal plan

    /**
     * Obtain today's dietary plan
     */
    public Map<String, Object> getTodayMealPlan(String userLogin) {
        LOG.debug("Getting today's meal plan for user: {}", userLogin);
        
        Optional<Plan> planOpt = getCurrentWeekPlan(userLogin);
        if (planOpt.isEmpty()) {
            return Map.of("error", "No plan found");
        }

        Plan plan = planOpt.get();
        String mealJson = plan.getMealPlanJson();
        
        if (mealJson == null || mealJson.isBlank()) {
            return Map.of("error", "Meal plan not generated yet");
        }

        try {
            Map<String, Object> weeklyPlan = objectMapper.readValue(mealJson, Map.class);
            String today = LocalDate.now().getDayOfWeek().toString().substring(0, 3).toLowerCase();
            
            if (weeklyPlan.containsKey(today)) {
                return (Map<String, Object>) weeklyPlan.get(today);
            } else {
                return Map.of("error", "No plan for today");
            }
            
        } catch (Exception e) {
            LOG.error("Failed to parse meal plan JSON", e);
            return Map.of("error", "Failed to load meal plan");
        }
    }

    /**
     * Obtain this week's meal plan
     */
    public List<Map<String, Object>> getWeeklyMealPlan(String userLogin) {
        LOG.debug("Getting weekly meal plan for user: {}", userLogin);
        
        Optional<Plan> planOpt = getCurrentWeekPlan(userLogin);
        if (planOpt.isEmpty()) {
            return Collections.emptyList();
        }

        Plan plan = planOpt.get();
        String mealJson = plan.getMealPlanJson();
        
        if (mealJson == null || mealJson.isBlank()) {
            return Collections.emptyList();
        }

        try {
            Map<String, Object> weeklyPlan = objectMapper.readValue(mealJson, Map.class);
            
            List<Map<String, Object>> result = new ArrayList<>();
            String[] days = {"mon", "tue", "wed", "thu", "fri", "sat", "sun"};
            String[] dayNames = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
            
            for (int i = 0; i < days.length; i++) {
                Map<String, Object> dayData = new HashMap<>();
                dayData.put("day", dayNames[i]);
                dayData.put("dayShort", String.valueOf(i + 1));
                dayData.put("plan", weeklyPlan.getOrDefault(days[i], null));
                result.add(dayData);
            }
            
            return result;
            
        } catch (Exception e) {
            LOG.error("Failed to parse weekly meal plan JSON", e);
            return Collections.emptyList();
        }
    }

    // workoutplan

    /**
     * Get today's workout plan
     */
    public Map<String, Object> getTodayWorkoutPlan(String userLogin) {
        LOG.debug("Getting today's workout plan for user: {}", userLogin);
        
        Optional<Plan> planOpt = getCurrentWeekPlan(userLogin);
        if (planOpt.isEmpty()) {
            return Map.of("error", "No plan found");
        }

        Plan plan = planOpt.get();
        String workoutJson = plan.getWorkoutPlanJson();
        
        if (workoutJson == null || workoutJson.isBlank()) {
            return Map.of("error", "Workout plan not generated yet");
        }

        try {
            Map<String, Object> weeklyPlan = objectMapper.readValue(workoutJson, Map.class);
            String today = LocalDate.now().getDayOfWeek().toString().substring(0, 3).toLowerCase();
            
            if (weeklyPlan.containsKey(today)) {
                return (Map<String, Object>) weeklyPlan.get(today);
            } else {
                return Map.of("isRestDay", true);
            }
            
        } catch (Exception e) {
            LOG.error("Failed to parse workout plan JSON", e);
            return Map.of("error", "Failed to load workout plan");
        }
    }

    /**
     * Get this week's exercise plan
     */
    public List<Map<String, Object>> getWeeklyWorkoutPlan(String userLogin) {
        LOG.debug("Getting weekly workout plan for user: {}", userLogin);
        
        Optional<Plan> planOpt = getCurrentWeekPlan(userLogin);
        if (planOpt.isEmpty()) {
            return Collections.emptyList();
        }

        Plan plan = planOpt.get();
        String workoutJson = plan.getWorkoutPlanJson();
        
        if (workoutJson == null || workoutJson.isBlank()) {
            return Collections.emptyList();
        }

        try {
            Map<String, Object> weeklyPlan = objectMapper.readValue(workoutJson, Map.class);
            
            List<Map<String, Object>> result = new ArrayList<>();
            String[] days = {"mon", "tue", "wed", "thu", "fri", "sat", "sun"};
            String[] dayNames = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
            String[] dayChinese = {"一", "二", "三", "四", "五", "六", "日"};
            
            for (int i = 0; i < days.length; i++) {
                Map<String, Object> dayData = new HashMap<>();
                dayData.put("day", dayNames[i]);
                dayData.put("dayShort", dayChinese[i]);
                
                Object planData = weeklyPlan.getOrDefault(days[i], Map.of("isRestDay", true));
                dayData.put("plan", planData);
                
                if (planData instanceof Map) {
                    Map<String, Object> p = (Map<String, Object>) planData;
                    if (p.containsKey("isRestDay") && (Boolean) p.get("isRestDay")) {
                        dayData.put("planTitle", "休息日");
                    } else {
                        dayData.put("planTitle", p.getOrDefault("title", "锻炼日"));
                    }
                }
                
                result.add(dayData);
            }
            
            return result;
            
        } catch (Exception e) {
            LOG.error("Failed to parse weekly workout plan JSON", e);
            return Collections.emptyList();
        }
    }

    // Simultaneously generate diet + exercise

    /**
     * Generate a comprehensive weekly plan for the user (diet + exercise)
     * 
     * Generate two plans simultaneously and save them to the same Plan record
     */
    public void generatePlanForUser(String userLogin) {
        LOG.debug("Generating complete plan (meal + workout) for user: {}", userLogin);
        
        Optional<UserProfile> profileOpt = userProfileRepository.findOneByUserLogin(userLogin);
        if (profileOpt.isEmpty()) {
            LOG.error("User profile not found for: {}", userLogin);
            return;
        }

        UserProfile profile = profileOpt.get();
        
        Map<String, Object> mealPlan = USE_AI_MODEL 
            ? callAiModelForMealPlan(profile) 
            : createMockMealPlan(profile);
            
        Map<String, Object> workoutPlan = USE_AI_MODEL 
            ? callAiModelForWorkoutPlan(profile) 
            : createMockWorkoutPlan(profile);
        
        try {
            String mealJson = objectMapper.writeValueAsString(mealPlan);
            String workoutJson = objectMapper.writeValueAsString(workoutPlan);
            
            Plan plan = new Plan();
            plan.setProfile(profile);
            plan.setCaloriesKcal(2000);
            plan.setProteinG(new java.math.BigDecimal("150"));
            plan.setCarbsG(new java.math.BigDecimal("200"));
            plan.setFatG(new java.math.BigDecimal("60"));
            plan.setSource(USE_AI_MODEL ? "AI_MODEL" : "MOCK");
            plan.setMealPlanJson(mealJson);
            plan.setWorkoutPlanJson(workoutJson);
            plan.setWeekStartDate(getWeekStart());
            plan.setCreatedAt(Instant.now());
            
            planRepository.save(plan);
            LOG.info("Complete plan created for user: {} (source: {})", userLogin, plan.getSource());
            
        } catch (Exception e) {
            LOG.error("Failed to generate plan", e);
        }
    }


    private LocalDate getWeekStart() {
        return LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    private Optional<Plan> getCurrentWeekPlan(String userLogin) {
        Optional<UserProfile> profileOpt = userProfileRepository.findOneByUserLogin(userLogin);
        if (profileOpt.isEmpty()) {
            return Optional.empty();
        }

        LocalDate weekStart = getWeekStart();
        
        List<Plan> plans = planRepository.findAll();
        return plans.stream()
            .filter(p -> p.getProfile().getId().equals(profileOpt.get().getId()))
            .filter(p -> p.getWeekStartDate() != null && p.getWeekStartDate().equals(weekStart))
            .findFirst();
    }

    // Invoke the AI model
    private Map<String, Object> callAiModelForMealPlan(UserProfile profile) {
        throw new UnsupportedOperationException("AI model not implemented yet");
    }

    private Map<String, Object> callAiModelForWorkoutPlan(UserProfile profile) {
        throw new UnsupportedOperationException("AI model not implemented yet");
    }

    private Map<String, Object> createMockMealPlan(UserProfile profile) {
        Map<String, Object> weekPlan = new HashMap<>();
        boolean isVegetarian = profile.getDietPref() == DietPref.VEGETARIAN;
        
        String[] days = {"mon", "tue", "wed", "thu", "fri", "sat", "sun"};
        for (String day : days) {
            Map<String, Object> dayPlan = new HashMap<>();
            dayPlan.put("breakfast", createMeal(
                isVegetarian ? "燕麦蛋白碗" : "高蛋白煎蛋卷", 
                450, 
                Map.of("p", 30, "c", 55, "f", 15)
            ));
            dayPlan.put("lunch", createMeal("鸡胸肉沙拉", 550, Map.of("p", 45, "c", 50, "f", 18)));
            dayPlan.put("dinner", createMeal("三文鱼", 600, Map.of("p", 50, "c", 45, "f", 25)));
            dayPlan.put("snack", createMeal("酸奶", 200, Map.of("p", 20, "c", 15, "f", 5)));
            weekPlan.put(day, dayPlan);
        }
        return weekPlan;
    }

    private Map<String, Object> createMockWorkoutPlan(UserProfile profile) {
        Map<String, Object> weekPlan = new HashMap<>();
        boolean isGainMuscle = profile.getGoal() == Goal.GAIN;
        
        weekPlan.put("mon", createWorkoutDay("胸部 & 三头", false));
        weekPlan.put("tue", createWorkoutDay("背部 & 二头", false));
        weekPlan.put("wed", Map.of("isRestDay", true));
        weekPlan.put("thu", createWorkoutDay("腿部 & 肩部", false));
        weekPlan.put("fri", createWorkoutDay("全身训练", false));
        weekPlan.put("sat", Map.of("isRestDay", true));
        weekPlan.put("sun", Map.of("isRestDay", true));
        
        return weekPlan;
    }

    private Map<String, Object> createMeal(String name, int calories, Map<String, Integer> macros) {
        return Map.of(
            "name", name,
            "calories", calories,
            "macros", macros,
            "ingredients", Arrays.asList("食材1", "食材2"),
            "recipe", Arrays.asList("步骤1", "步骤2"),
            "amazonLink", "https://amazon.com"
        );
    }

    private Map<String, Object> createWorkoutDay(String title, boolean isRestDay) {
        if (isRestDay) {
            return Map.of("isRestDay", true);
        }
        return Map.of(
            "title", title,
            "isRestDay", false,
            "warmUp", Map.of("name", "热身", "sets", 1, "reps", "60s"),
            "exercises", Arrays.asList(
                Map.of("name", "动作1", "sets", 3, "reps", "10-12"),
                Map.of("name", "动作2", "sets", 3, "reps", "10-12")
            ),
            "coolDown", Map.of("name", "拉伸", "sets", 1, "reps", "30s")
        );
    }
}