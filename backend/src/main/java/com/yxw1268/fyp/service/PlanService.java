package com.yxw1268.fyp.service;

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
import java.math.BigDecimal;
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
     * Get the plan the user is currently on, if one has been generated.
     */
    @Transactional(readOnly = true)
    public Optional<PlanDTO> findCurrentForUser(String login) {
        return planRepository.findFirstByProfile_User_LoginOrderByCreatedAtDesc(login)
            .map(planMapper::toDto)
            .map(this::convertJsonToObject);
    }

    /**
     * Generate this week's plan for a profile, replacing the previous one.
     *
     * The targets come from {@link PlanEngine}; what the user logged while on the previous plan
     * adjusts them. Meals are then requested for those targets. If no meals can be produced the
     * plan is still saved, without them, so targets and training are never lost to an LLM outage.
     */
    public PlanDTO generatePlanForProfile(UserProfile profile) {
        LOG.info("Generating plan for user profile: id={}, goal={}", profile.getId(), profile.getGoal());

        Instant now = Instant.now();
        AdaptiveState state = planRepository
            .findFirstByProfileIdOrderByCreatedAtDesc(profile.getId())
            .map(previous -> adaptFrom(previous, profile, now))
            .orElse(AdaptiveState.INITIAL);
        PlanTargets targets = PlanEngine.build(toInput(profile), state);

        progressLogRepository.detachPlansOfProfile(profile.getId());
        planRepository.deleteAllByProfileId(profile.getId());

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
        try {
            plan.setDetailsJson(objectMapper.writeValueAsString(targets.details()));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize plan details", e);
        }

        Object mealPlanData = requestMealPlan(profile, targets);
        if (mealPlanData != null) {
            try {
                plan.setMealPlanJson(objectMapper.writeValueAsString(mealPlanData));
            } catch (Exception e) {
                LOG.warn("Failed to serialize meal plan: {}", e.getMessage());
            }
        }

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

        return convertJsonToObject(planMapper.toDto(plan));
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

    /**
     * What the user's logs say about how the previous plan went. Plans made before the engine
     * existed carry no details, and start from scratch.
     */
    private AdaptiveState adaptFrom(Plan previous, UserProfile profile, Instant now) {
        if (previous.getDetailsJson() == null) {
            return AdaptiveState.INITIAL;
        }
        PlanDetails details;
        try {
            details = objectMapper.readValue(previous.getDetailsJson(), PlanDetails.class);
        } catch (Exception e) {
            LOG.warn("Unreadable details on plan {}: {}", previous.getId(), e.getMessage());
            return AdaptiveState.INITIAL;
        }

        LocalDate from = LocalDate.ofInstant(now, ZoneOffset.UTC).minusDays(LOG_HISTORY_DAYS);
        List<LogEntry> logs = progressLogRepository
            .findAllByProfileIdAndLogDateGreaterThanEqualOrderByLogDateAsc(profile.getId(), from)
            .stream()
            .map(log ->
                new LogEntry(
                    log.getLogDate(),
                    log.getWeightKg() == null ? null : log.getWeightKg().doubleValue(),
                    Boolean.TRUE.equals(log.getCompletedWorkout())
                )
            )
            .toList();

        return PlanEngine.adapt(details, previous.getCaloriesKcal(), previous.getCreatedAt(), logs, now);
    }

    /**
     * Ask the ML service for a week of meals matching the targets, or null if it can't provide one.
     */
    private Object requestMealPlan(UserProfile profile, PlanTargets targets) {
        List<DayTarget> days = targets.details().days();
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
            return mlServiceClient.mealPlan(request).get("weeklyMealPlan");
        } catch (Exception e) {
            LOG.error("Meal plan generation failed for profile {}: {}", profile.getId(), e.getMessage());
            return null;
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