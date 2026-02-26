package com.yxw1268.fyp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yxw1268.fyp.domain.Plan;
import com.yxw1268.fyp.domain.UserProfile;
import com.yxw1268.fyp.repository.PlanRepository;
import com.yxw1268.fyp.repository.UserProfileRepository;
import com.yxw1268.fyp.security.SecurityUtils;
import com.yxw1268.fyp.service.dto.PlanDTO;
import com.yxw1268.fyp.service.mapper.PlanMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

/**
 * Service Implementation for managing {@link com.yxw1268.fyp.domain.Plan}.
 */
@Service
@Transactional
public class PlanService {

    private static final Logger LOG = LoggerFactory.getLogger(PlanService.class);

    private final PlanRepository planRepository;
    private final UserProfileRepository userProfileRepository;
    private final PlanMapper planMapper;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.ml-service.url}")
    private String mlServiceUrl;

    public PlanService(
        PlanRepository planRepository,
        UserProfileRepository userProfileRepository,
        PlanMapper planMapper
    ) {
        this.planRepository = planRepository;
        this.userProfileRepository = userProfileRepository;
        this.planMapper = planMapper;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(120000);
        this.restTemplate = new RestTemplate(factory);

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

        LOG.info("User profile found: age={}, weight={}, goal={}",
            profile.getAge(), profile.getWeightKg(), profile.getGoal());

        Map<String, Object> aiResult = callFlaskApi(profile);

        Plan plan = new Plan();
        plan.setProfile(profile);
        plan.setCaloriesKcal((Integer) aiResult.get("caloriesKcal"));
        plan.setProteinG(BigDecimal.valueOf(((Number) aiResult.get("proteinG")).doubleValue()));
        plan.setCarbsG(BigDecimal.valueOf(((Number) aiResult.get("carbsG")).doubleValue()));
        plan.setFatG(BigDecimal.valueOf(((Number) aiResult.get("fatG")).doubleValue()));
        plan.setWorkoutType(com.yxw1268.fyp.domain.enumeration.WorkoutType.valueOf(
            (String) aiResult.get("workoutType")
        ));
        plan.setWorkoutIntensity(BigDecimal.valueOf(((Number) aiResult.get("workoutIntensity")).doubleValue()));
        plan.setSource("AI_MODEL");
        plan.setCreatedAt(Instant.now());

        // Store weekly meal plan or single meal plan
        Object mealPlanData = null;
        if (aiResult.containsKey("weeklyMealPlan")) {
            mealPlanData = aiResult.get("weeklyMealPlan");
            LOG.info("Weekly meal plan received (7 days)");
        } else if (aiResult.containsKey("mealPlan")) {
            mealPlanData = aiResult.get("mealPlan");
            LOG.info("Single-day meal plan received (legacy format)");
        }

        if (mealPlanData != null) {
            try {
                String mealPlanJson = objectMapper.writeValueAsString(mealPlanData);
                plan.setMealPlanJson(mealPlanJson);
                LOG.info("Meal plan saved to database");
            } catch (Exception e) {
                LOG.warn("Failed to serialize meal plan: {}", e.getMessage());
            }
        }

        plan = planRepository.save(plan);

        LOG.info("Plan saved: id={}, calories={}, workout={}",
            plan.getId(), plan.getCaloriesKcal(), plan.getWorkoutType());

        PlanDTO planDTO = planMapper.toDto(plan);

        if (mealPlanData != null) {
            planDTO.setMealPlan(mealPlanData);
            LOG.info("Added meal plan data to response DTO");
        }

        return planDTO;
    }

    /**
     * Call Flask ML service API.
     */
    private Map<String, Object> callFlaskApi(UserProfile profile) {
        String url = mlServiceUrl + "/api/predict";

        LOG.info("Calling Flask API: {}", url);

        Map<String, Object> request = new HashMap<>();
        request.put("age", profile.getAge());
        request.put("heightCm", profile.getHeightCm());
        request.put("weightKg", profile.getWeightKg());
        request.put("activityLevel", profile.getActivityLevel().name());
        request.put("goal", profile.getGoal().name());
        request.put("dietPref", profile.getDietPref().name());
        request.put("metabolicProfile", profile.getMetabolicProfile().name());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                Map<String, Object> body = response.getBody();
                LOG.info("Flask API response: calories={}, workout={}",
                    body.get("caloriesKcal"), body.get("workoutType"));

                if (body.containsKey("weeklyMealPlan")) {
                    LOG.info("Weekly meal plan received from Llama 3.1 via Groq");
                } else if (body.containsKey("mealPlan")) {
                    LOG.info("Single meal plan received from Llama 3");
                }

                return body;
            } else {
                throw new RuntimeException("Flask API returned status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            LOG.error("Failed to call Flask API: {}", e.getMessage());
            throw new RuntimeException("Failed to generate AI plan", e);
        }
    }

    /**
     * Convert stored JSON string back to object for frontend consumption.
     */
    private PlanDTO convertJsonToObject(PlanDTO dto) {
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