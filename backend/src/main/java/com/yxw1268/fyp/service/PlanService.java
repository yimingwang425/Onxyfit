package com.yxw1268.fyp.service;

import com.yxw1268.fyp.domain.Plan;
import com.yxw1268.fyp.domain.UserProfile;
import com.yxw1268.fyp.repository.PlanRepository;
import com.yxw1268.fyp.repository.UserProfileRepository;
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
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.DefaultResponseErrorHandler;
import org.springframework.web.client.RestTemplate;

/**
 * Service Implementation for managing {@link com.yxw1268.fyp.domain.Plan}.
 */
@Service
@Transactional
public class PlanService {

    private static final Logger LOG = LoggerFactory.getLogger(PlanService.class);

    @Value("${app.ml-service.url:http://localhost:5001}")
    private String mlServiceUrl;

    private final PlanRepository planRepository;
    private final PlanMapper planMapper;
    private final UserProfileRepository userProfileRepository;
    private final RestTemplate restTemplate;

    public PlanService(
        PlanRepository planRepository,
        PlanMapper planMapper,
        UserProfileRepository userProfileRepository
    ) {
        this.planRepository = planRepository;
        this.planMapper = planMapper;
        this.userProfileRepository = userProfileRepository;
        this.restTemplate = new RestTemplate();
        this.restTemplate.setErrorHandler(new DefaultResponseErrorHandler() {
        @Override
        protected boolean hasError(HttpStatusCode statusCode) {
            return statusCode.is5xxServerError();
        }
    });
    
    }

    /**
     * call Flask API
     *
     * @param userId
     * @return plan
     */
    public PlanDTO generatePlanForUser(Long userId) {
        LOG.debug("Request to generate AI plan for user: {}", userId);

        // Profile
        UserProfile profile = userProfileRepository
            .findOneByUserId(userId)
            .orElseThrow(() -> new RuntimeException("User profile not found for user: " + userId));

        Map<String, Object> aiResult = callFlaskApi(profile);

        // Create a Plan object
        Plan plan = new Plan();
        plan.setProfile(profile);

        // nutritional data
        plan.setCaloriesKcal(((Number) aiResult.get("caloriesKcal")).intValue());
        plan.setProteinG(BigDecimal.valueOf(((Number) aiResult.get("proteinG")).doubleValue()));
        plan.setCarbsG(BigDecimal.valueOf(((Number) aiResult.get("carbsG")).doubleValue()));
        plan.setFatG(BigDecimal.valueOf(((Number) aiResult.get("fatG")).doubleValue()));

        // workout data
        plan.setWorkoutIntensity(BigDecimal.valueOf(((Number) aiResult.get("workoutIntensity")).doubleValue()));
        plan.setWorkoutType(com.yxw1268.fyp.domain.enumeration.WorkoutType.valueOf((String) aiResult.get("workoutType")));

        plan.setSource("AI_MODEL");
        plan.setCreatedAt(Instant.now());

        // Save
        plan = planRepository.save(plan);

        LOG.info("Generated AI plan for user {}: {} kcal, {} workout", userId, plan.getCaloriesKcal(), plan.getWorkoutType());

        return planMapper.toDto(plan);
    }

    /**
     * call Flask API
     */
    private Map<String, Object> callFlaskApi(UserProfile profile) {
    try {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("age", profile.getAge());
        requestBody.put("heightCm", profile.getHeightCm());
        requestBody.put("weightKg", profile.getWeightKg());
        requestBody.put("activityLevel", profile.getActivityLevel().name());
        requestBody.put("goal", profile.getGoal().name());
        requestBody.put("dietPref", profile.getDietPref().name());
        requestBody.put("metabolicProfile", profile.getMetabolicProfile().name());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(java.util.Collections.singletonList(MediaType.APPLICATION_JSON));
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        // call Flask API
        String url = mlServiceUrl + "/api/predict";
        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

        if (response.getStatusCode().is2xxSuccessful()) {
            return response.getBody();
        } else {
            String errorMsg = String.format("Flask API returned error: %s", response.getStatusCode());
            LOG.error(errorMsg);
            throw new RuntimeException(errorMsg);
        }
    } catch (org.springframework.web.client.HttpClientErrorException e) {
        LOG.error("HTTP Client Error: Status={}, Body={}", e.getStatusCode(), e.getResponseBodyAsString());
        throw new RuntimeException("Flask API returned error: " + e.getStatusCode() + " " + e.getStatusCode().toString());
    } catch (org.springframework.web.client.ResourceAccessException e) {
        LOG.error("Cannot connect to Flask service at {}: {}", mlServiceUrl, e.getMessage());
        throw new RuntimeException("Cannot connect to ML service. Is Flask running?");
    } catch (Exception e) {
        LOG.error("Unexpected error calling ML service: ", e);
        throw new RuntimeException("Failed to generate AI plan: " + e.getMessage(), e);
    }
    }

    /**
     * Save a plan.
     *
     * @param planDTO the entity to save.
     * @return the persisted entity.
     */
    public PlanDTO save(PlanDTO planDTO) {
        LOG.debug("Request to save Plan : {}", planDTO);
        Plan plan = planMapper.toEntity(planDTO);
        plan = planRepository.save(plan);
        return planMapper.toDto(plan);
    }

    /**
     * Update a plan.
     *
     * @param planDTO the entity to save.
     * @return the persisted entity.
     */
    public PlanDTO update(PlanDTO planDTO) {
        LOG.debug("Request to update Plan : {}", planDTO);
        Plan plan = planMapper.toEntity(planDTO);
        plan = planRepository.save(plan);
        return planMapper.toDto(plan);
    }

    /**
     * Partially update a plan.
     *
     * @param planDTO the entity to update partially.
     * @return the persisted entity.
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
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<PlanDTO> findAll(Pageable pageable) {
        LOG.debug("Request to get all Plans");
        return planRepository.findAll(pageable).map(planMapper::toDto);
    }

    /**
     * Get one plan by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<PlanDTO> findOne(Long id) {
        LOG.debug("Request to get Plan : {}", id);
        return planRepository.findById(id).map(planMapper::toDto);
    }

    /**
     * Delete the plan by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete Plan : {}", id);
        planRepository.deleteById(id);
    }
}