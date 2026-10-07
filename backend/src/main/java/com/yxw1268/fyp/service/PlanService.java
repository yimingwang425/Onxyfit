package com.yxw1268.fyp.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yxw1268.fyp.domain.Plan;
import com.yxw1268.fyp.domain.UserProfile;
import com.yxw1268.fyp.domain.enumeration.CookingEffort;
import com.yxw1268.fyp.domain.enumeration.MetabolicProfile;
import com.yxw1268.fyp.repository.PlanRepository;
import com.yxw1268.fyp.repository.ProgressLogRepository;
import com.yxw1268.fyp.repository.UserProfileRepository;
import com.yxw1268.fyp.security.SecurityUtils;
import com.yxw1268.fyp.service.dto.PlanDTO;
import com.yxw1268.fyp.service.mapper.PlanMapper;
import com.yxw1268.fyp.service.plan.AdaptiveState;
import com.yxw1268.fyp.service.plan.DayTarget;
import com.yxw1268.fyp.service.plan.LogEntry;
import com.yxw1268.fyp.service.plan.PlanDetails;
import com.yxw1268.fyp.service.plan.PlanEngine;
import com.yxw1268.fyp.service.plan.PlanInput;
import com.yxw1268.fyp.service.plan.PlanTargets;
import com.yxw1268.fyp.service.plan.WeekConstraint;
import com.yxw1268.fyp.service.plan.WeeklyReport;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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

    /** How far back logs are read when adapting a plan. */
    private static final int LOG_HISTORY_DAYS = 35;

    /** Someone who opened the app this recently gets meals generated ahead of time each week. */
    private static final Duration ACTIVE_WITHIN = Duration.ofDays(14);

    /** How often, at most, a look at the plan is written down. */
    private static final Duration VIEW_RECORD_INTERVAL = Duration.ofHours(1);

    private static final String MEALS_OK = "ok";
    private static final String MEALS_UNAVAILABLE = "llm_unavailable";

    private final PlanRepository planRepository;
    private final ProgressLogRepository progressLogRepository;
    private final UserProfileRepository userProfileRepository;
    private final PlanMapper planMapper;
    private final MlServiceClient mlServiceClient;
    private final ObjectMapper objectMapper;

    public PlanService(
        PlanRepository planRepository,
        ProgressLogRepository progressLogRepository,
        UserProfileRepository userProfileRepository,
        PlanMapper planMapper,
        MlServiceClient mlServiceClient
    ) {
        this.planRepository = planRepository;
        this.progressLogRepository = progressLogRepository;
        this.userProfileRepository = userProfileRepository;
        this.planMapper = planMapper;
        this.mlServiceClient = mlServiceClient;

        this.objectMapper = new ObjectMapper();
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
        return planRepository.findAll(pageable)
            .map(planMapper::toDto)
            .map(this::convertJsonToObject);
    }

    /**
     * Get the plans belonging to one user.
     */
    @Transactional(readOnly = true)
    public Page<PlanDTO> findAllForUser(String login, Pageable pageable) {
        LOG.debug("Request to get Plans of user {}", login);
        return planRepository.findAllByProfile_User_Login(login, pageable)
            .map(planMapper::toDto)
            .map(this::convertJsonToObject);
    }

    /**
     * Get one plan by id.
     */
    @Transactional(readOnly = true)
    public Optional<PlanDTO> findOne(Long id) {
        LOG.debug("Request to get Plan : {}", id);
        return planRepository.findById(id)
            .map(planMapper::toDto)
            .map(this::convertJsonToObject);
    }

    /**
     * Delete the plan by id.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete Plan : {}", id);
        planRepository.deleteById(id);
    }

    /**
     * Generate a plan for the current user.
     */
    public PlanDTO generatePlanForCurrentUser() {
        String currentUserLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new RuntimeException("No user logged in"));
 
        LOG.info("Current user: {}", currentUserLogin);
 
        UserProfile profile = userProfileRepository.findOneByUserLogin(currentUserLogin)
            .orElseThrow(() -> new RuntimeException("User profile not found"));
 
        return generatePlanForProfile(profile);
    }

    /**
     * Get the plan the user is currently on, if one has been generated, noting that they looked at it.
     */
    public Optional<PlanDTO> findCurrentForUser(String login) {
        return planRepository
            .findFirstByProfile_User_LoginOrderByCreatedAtDesc(login)
            .map(plan -> {
                Instant now = Instant.now();
                if (plan.getLastViewedAt() == null || plan.getLastViewedAt().isBefore(now.minus(VIEW_RECORD_INTERVAL))) {
                    plan.setLastViewedAt(now);
                    plan = planRepository.save(plan);
                }
                return plan;
            })
            .map(planMapper::toDto)
            .map(this::convertJsonToObject);
    }

    /**
     * Generate this week's plan for a profile at the user's request, with meals.
     */
    public PlanDTO generatePlanForProfile(UserProfile profile) {
        return generatePlanForProfile(profile, true);
    }

    /**
     * Generate this week's plan as part of the weekly run. Everyone gets new targets and training;
     * meals, which cost an LLM call, are only generated for people who have opened the app recently.
     * Anyone else gets theirs the next time they do.
     */
    public PlanDTO regenerateWeekly(UserProfile profile) {
        Instant activeSince = Instant.now().minus(ACTIVE_WITHIN);
        boolean active = planRepository
            .findFirstByProfileIdOrderByCreatedAtDesc(profile.getId())
            .map(Plan::getLastViewedAt)
            .filter(viewed -> viewed.isAfter(activeSince))
            .isPresent();
        return generatePlanForProfile(profile, active);
    }

    /**
     * Generate this week's plan for a profile, replacing the previous one.
     *
     * The targets come from {@link PlanEngine}; what the user logged while on the previous plan
     * adjusts them. Meals are then requested for those targets. If no meals can be produced the
     * plan is still saved, without them, so targets and training are never lost to an LLM outage.
     */
    private PlanDTO generatePlanForProfile(UserProfile profile, boolean withMeals) {
        LOG.info("Generating plan for user profile: id={}, goal={}, meals={}", profile.getId(), profile.getGoal(), withMeals);

        Instant now = Instant.now();
        Optional<Plan> previous = planRepository.findFirstByProfileIdOrderByCreatedAtDesc(profile.getId());
        PlanDetails previousDetails = previous.map(this::readDetails).orElse(null);

        // Plans made before the engine existed carry no details, and start from scratch.
        AdaptiveState state = AdaptiveState.INITIAL;
        List<LogEntry> logs = List.of();
        if (previousDetails != null) {
            logs = recentLogs(profile, now);
            Plan prev = previous.orElseThrow();
            state = PlanEngine.adapt(previousDetails, prev.getCaloriesKcal(), prev.getCreatedAt(), logs, now);
        }
        // Something the user asked for "this week only" lasts until the plan has run its week
        WeekConstraint constraint = previousDetails != null && !PlanEngine.hasRunItsWeek(previous.orElseThrow().getCreatedAt(), now)
            ? previousDetails.weekConstraint()
            : null;
        PlanTargets targets = PlanEngine.build(toInput(profile), state, constraint);

        Plan plan = new Plan();
        plan.setProfile(profile);
        plan.setCaloriesKcal(targets.caloriesKcal());
        plan.setProteinG(BigDecimal.valueOf(targets.proteinG()));
        plan.setCarbsG(BigDecimal.valueOf(targets.carbsG()));
        plan.setFatG(BigDecimal.valueOf(targets.fatG()));
        plan.setWorkoutType(targets.workoutType());
        plan.setWorkoutIntensity(BigDecimal.valueOf(targets.workoutIntensity()));
        plan.setSource("ADAPTIVE_ENGINE");
        plan.setCreatedAt(now);
        plan.setLastViewedAt(previous.map(Plan::getLastViewedAt).orElse(null));
        try {
            plan.setDetailsJson(objectMapper.writeValueAsString(targets.details()));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize plan details", e);
        }

        // A report is written when a plan has run its week; regenerating mid-week keeps the one in place.
        if (previousDetails != null && PlanEngine.hasRunItsWeek(previous.orElseThrow().getCreatedAt(), now)) {
            plan.setWeeklyReport(WeeklyReport.compose(PlanEngine.summarize(previousDetails, logs, now), state.reasons(), targets));
        } else {
            plan.setWeeklyReport(previous.map(Plan::getWeeklyReport).orElse(null));
        }

        String mealStatus = null;
        if (withMeals) {
            mealStatus = attachMeals(plan, profile, targets.details().days());
        }

        progressLogRepository.detachPlansOfProfile(profile.getId());
        planRepository.deleteAllByProfileId(profile.getId());
        plan = planRepository.save(plan);

        LOG.info(
            "Plan saved: id={}, calories={}, workout={}, calorieAdjustment={}, trainingOffset={}, meals={}",
            plan.getId(),
            plan.getCaloriesKcal(),
            plan.getWorkoutType(),
            targets.details().calorieAdjustmentKcal(),
            targets.details().trainingOffset(),
            plan.getMealPlanJson() != null
        );

        PlanDTO dto = convertJsonToObject(planMapper.toDto(plan));
        dto.setMealStatus(mealStatus);
        return dto;
    }

    /**
     * Generate meals for the current user's existing plan, leaving its targets and training as
     * they are. Used when a plan has no meals yet, or its meals could not be generated earlier.
     */
    public PlanDTO regenerateMealsForCurrentUser() {
        String login = SecurityUtils.getCurrentUserLogin().orElseThrow(() -> new RuntimeException("No user logged in"));
        UserProfile profile = userProfileRepository
            .findOneByUserLogin(login)
            .orElseThrow(() -> new RuntimeException("User profile not found"));
        return regenerateMeals(profile);
    }

    /**
     * Generate meals for a profile's existing plan, leaving its targets and training as they are.
     */
    public PlanDTO regenerateMeals(UserProfile profile) {
        Optional<Plan> current = planRepository.findFirstByProfileIdOrderByCreatedAtDesc(profile.getId());
        PlanDetails details = current.map(this::readDetails).orElse(null);
        if (details == null) {
            // No plan yet, or one from before the engine: build a full one
            return generatePlanForProfile(profile, true);
        }

        Plan plan = current.orElseThrow();
        String mealStatus = attachMeals(plan, profile, details.days());
        PlanDTO dto = convertJsonToObject(planMapper.toDto(planRepository.save(plan)));
        dto.setMealStatus(mealStatus);
        return dto;
    }

    /**
     * The details of the plan a profile is on, if it has one built by the engine.
     */
    @Transactional(readOnly = true)
    public Optional<PlanDetails> currentDetails(UserProfile profile) {
        return planRepository.findFirstByProfileIdOrderByCreatedAtDesc(profile.getId()).map(this::readDetails);
    }

    /**
     * What the current plan would become under a week-only constraint, without changing anything.
     */
    @Transactional(readOnly = true)
    public Optional<PlanTargets> previewWeekConstraint(UserProfile profile, WeekConstraint constraint) {
        return currentDetails(profile).map(details -> PlanEngine.build(toInput(profile), stateOf(details), constraint));
    }

    /**
     * Rework the current plan's targets and training for a week-only constraint (null lifts it).
     * The plan keeps its place in the weekly cycle, and its meals.
     */
    public Optional<PlanDTO> applyWeekConstraint(UserProfile profile, WeekConstraint constraint) {
        Optional<Plan> current = planRepository.findFirstByProfileIdOrderByCreatedAtDesc(profile.getId());
        PlanDetails details = current.map(this::readDetails).orElse(null);
        if (details == null) {
            return Optional.empty();
        }

        Plan plan = current.orElseThrow();
        return Optional.of(rebuildInPlace(plan, PlanEngine.build(toInput(profile), stateOf(details), constraint)));
    }

    /** Marks, in the weekly report, that the user turned down the lighter week it announces. */
    static final String KEPT_USUAL_VOLUME = "You chose to keep your usual training volume this week.";

    /**
     * Undo the lighter week the plan was given because the user reported being run down: they
     * would rather train as usual. Everything else about the plan stays, including anything they
     * asked for this week. It lasts until the next weekly plan, which looks at the new week afresh.
     */
    public Optional<PlanDTO> keepUsualTrainingVolume(UserProfile profile) {
        Optional<Plan> current = planRepository.findFirstByProfileIdOrderByCreatedAtDesc(profile.getId());
        PlanDetails details = current.map(this::readDetails).orElse(null);
        if (details == null) {
            return Optional.empty();
        }
        Plan plan = current.orElseThrow();
        if (!details.recoveryWeek()) {
            return Optional.of(convertJsonToObject(planMapper.toDto(plan)));
        }

        AdaptiveState state = new AdaptiveState(details.calorieAdjustmentKcal(), details.trainingOffset(), false, List.of());
        if (plan.getWeeklyReport() != null && !plan.getWeeklyReport().contains(KEPT_USUAL_VOLUME)) {
            plan.setWeeklyReport(plan.getWeeklyReport() + " " + KEPT_USUAL_VOLUME);
        }
        return Optional.of(rebuildInPlace(plan, PlanEngine.build(toInput(profile), state, details.weekConstraint())));
    }

    /** Give an existing plan new targets and training; it keeps its id, its place in the weekly cycle and its meals. */
    private PlanDTO rebuildInPlace(Plan plan, PlanTargets targets) {
        plan.setCaloriesKcal(targets.caloriesKcal());
        plan.setProteinG(BigDecimal.valueOf(targets.proteinG()));
        plan.setCarbsG(BigDecimal.valueOf(targets.carbsG()));
        plan.setFatG(BigDecimal.valueOf(targets.fatG()));
        plan.setWorkoutType(targets.workoutType());
        plan.setWorkoutIntensity(BigDecimal.valueOf(targets.workoutIntensity()));
        try {
            plan.setDetailsJson(objectMapper.writeValueAsString(targets.details()));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize plan details", e);
        }
        return convertJsonToObject(planMapper.toDto(planRepository.save(plan)));
    }

    private static AdaptiveState stateOf(PlanDetails details) {
        return new AdaptiveState(details.calorieAdjustmentKcal(), details.trainingOffset(), details.recoveryWeek(), List.of());
    }

    /**
     * One meal of the current plan (day 0 = Sunday; slot "breakfast", "lunch", "dinner" or "snack"), if it is there.
     */
    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> currentMeal(UserProfile profile, int day, String slot) {
        return planRepository
            .findFirstByProfileIdOrderByCreatedAtDesc(profile.getId())
            .map(this::readMeals)
            .map(week -> week.get(String.valueOf(day)))
            .map(meals -> meals.get(slot));
    }

    /**
     * The meals of one day of the current plan, keyed by slot.
     */
    @Transactional(readOnly = true)
    public Map<String, Map<String, Object>> currentMealsOfDay(UserProfile profile, int day) {
        return planRepository
            .findFirstByProfileIdOrderByCreatedAtDesc(profile.getId())
            .map(this::readMeals)
            .map(week -> week.get(String.valueOf(day)))
            .orElse(Map.of());
    }

    /**
     * Put a different meal into one slot of the current plan.
     */
    public Optional<PlanDTO> replaceMeal(UserProfile profile, int day, String slot, Map<String, Object> meal) {
        Optional<Plan> current = planRepository.findFirstByProfileIdOrderByCreatedAtDesc(profile.getId());
        if (current.isEmpty()) {
            return Optional.empty();
        }
        Plan plan = current.orElseThrow();
        Map<String, Map<String, Map<String, Object>>> week = readMeals(plan);
        Map<String, Map<String, Object>> meals = week.get(String.valueOf(day));
        if (meals == null || !meals.containsKey(slot)) {
            return Optional.empty();
        }
        meals.put(slot, meal);
        try {
            plan.setMealPlanJson(objectMapper.writeValueAsString(week));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize meal plan", e);
        }
        return Optional.of(convertJsonToObject(planMapper.toDto(planRepository.save(plan))));
    }

    /** day ("0".."6") -> slot -> meal; empty if the plan has no usable meals. */
    private Map<String, Map<String, Map<String, Object>>> readMeals(Plan plan) {
        if (plan.getMealPlanJson() == null) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(plan.getMealPlanJson(), new TypeReference<Map<String, Map<String, Map<String, Object>>>>() {});
        } catch (Exception e) {
            LOG.warn("Unreadable meals on plan {}: {}", plan.getId(), e.getMessage());
            return new HashMap<>();
        }
    }

    private static PlanInput toInput(UserProfile profile) {
        return new PlanInput(
            profile.getAge(),
            profile.getHeightCm().doubleValue(),
            profile.getWeightKg().doubleValue(),
            profile.getMetabolicProfile() == MetabolicProfile.PROFILE_1,
            profile.getActivityLevel(),
            profile.getGoal(),
            profile.getDietPref()
        );
    }

    private PlanDetails readDetails(Plan plan) {
        if (plan.getDetailsJson() == null) {
            return null;
        }
        try {
            return objectMapper.readValue(plan.getDetailsJson(), PlanDetails.class);
        } catch (Exception e) {
            LOG.warn("Unreadable details on plan {}: {}", plan.getId(), e.getMessage());
            return null;
        }
    }

    private List<LogEntry> recentLogs(UserProfile profile, Instant now) {
        LocalDate from = LocalDate.ofInstant(now, ZoneOffset.UTC).minusDays(LOG_HISTORY_DAYS);
        return progressLogRepository
            .findAllByProfileIdAndLogDateGreaterThanEqualOrderByLogDateAsc(profile.getId(), from)
            .stream()
            .map(log ->
                new LogEntry(
                    log.getLogDate(),
                    log.getWeightKg() == null ? null : log.getWeightKg().doubleValue(),
                    Boolean.TRUE.equals(log.getCompletedWorkout()),
                    // feeling tired after training is normal, so only a mood from before it counts
                    Boolean.TRUE.equals(log.getMoodAfterWorkout()) ? null : log.getMood()
                )
            )
            .toList();
    }

    /**
     * Ask the ML service for a week of meals matching the day targets and put them on the plan.
     * Meals already on the plan are kept if no new ones could be made.
     *
     * @return "ok", or the reason there are no new meals
     */
    @SuppressWarnings("unchecked")
    private String attachMeals(Plan plan, UserProfile profile, List<DayTarget> days) {
        DayTarget rest = days.stream().filter(day -> !day.training()).findFirst().orElse(days.get(0));
        DayTarget training = days.stream().filter(DayTarget::training).findFirst().orElse(rest);

        Map<String, Object> request = new HashMap<>();
        request.put(
            "restDay",
            Map.of("calories", rest.calories(), "proteinG", rest.proteinG(), "carbsG", rest.carbsG(), "fatG", rest.fatG())
        );
        request.put("trainingFuelKcal", Math.max(0, training.calories() - rest.calories()));
        request.put("trainingDays", days.stream().map(DayTarget::training).toList());
        request.put("dietPref", profile.getDietPref().name());
        request.put("cookingEffort", (profile.getCookingEffort() == null ? CookingEffort.SIMPLE : profile.getCookingEffort()).name());
        request.put("allergies", DietaryRestrictions.parseAllergies(profile.getAllergies()).stream().map(Enum::name).toList());
        request.put("dislikes", DietaryRestrictions.parseDislikes(profile.getFoodDislikes()));

        try {
            Map<String, Object> response = mlServiceClient.mealPlan(request);
            Object meals = response.get("weeklyMealPlan");
            if (meals instanceof Map<?, ?> week && !week.isEmpty()) {
                plan.setMealPlanJson(objectMapper.writeValueAsString(meals));
                return MEALS_OK;
            }
            String status = response.get("status") instanceof String reason && !MEALS_OK.equals(reason) ? reason : MEALS_UNAVAILABLE;
            LOG.warn("No meal plan for profile {}: {}", profile.getId(), status);
            return status;
        } catch (Exception e) {
            LOG.error("Meal plan generation failed for profile {}: {}", profile.getId(), e.getMessage());
            return MEALS_UNAVAILABLE;
        }
    }

    /**
     * Convert stored JSON string back to object for frontend consumption.
     */
    private PlanDTO convertJsonToObject(PlanDTO dto) {
        if (dto != null && dto.getDetailsJson() != null) {
            try {
                dto.setDetails(objectMapper.readValue(dto.getDetailsJson(), Object.class));
            } catch (Exception e) {
                LOG.warn("Failed to parse stored plan details JSON: {}", e.getMessage());
            }
        }
        if (dto != null && dto.getMealPlanJson() != null) {
            try {
                Object mealObject = objectMapper.readValue(dto.getMealPlanJson(), Object.class);
                dto.setMealPlan(mealObject);
            } catch (Exception e) {
                LOG.warn("Failed to parse stored meal plan JSON: {}", e.getMessage());
            }
        }
        return dto;
    }
}