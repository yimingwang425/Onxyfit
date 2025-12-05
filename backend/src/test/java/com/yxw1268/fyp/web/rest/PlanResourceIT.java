package com.yxw1268.fyp.web.rest;

import static com.yxw1268.fyp.domain.PlanAsserts.*;
import static com.yxw1268.fyp.web.rest.TestUtil.createUpdateProxyForBean;
import static com.yxw1268.fyp.web.rest.TestUtil.sameNumber;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yxw1268.fyp.IntegrationTest;
import com.yxw1268.fyp.domain.Plan;
import com.yxw1268.fyp.domain.UserProfile;
import com.yxw1268.fyp.domain.enumeration.WorkoutType;
import com.yxw1268.fyp.repository.PlanRepository;
import com.yxw1268.fyp.service.dto.PlanDTO;
import com.yxw1268.fyp.service.mapper.PlanMapper;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link PlanResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class PlanResourceIT {

    private static final Integer DEFAULT_CALORIES_KCAL = 100;
    private static final Integer UPDATED_CALORIES_KCAL = 101;

    private static final BigDecimal DEFAULT_PROTEIN_G = new BigDecimal(0);
    private static final BigDecimal UPDATED_PROTEIN_G = new BigDecimal(1);

    private static final BigDecimal DEFAULT_CARBS_G = new BigDecimal(0);
    private static final BigDecimal UPDATED_CARBS_G = new BigDecimal(1);

    private static final BigDecimal DEFAULT_FAT_G = new BigDecimal(0);
    private static final BigDecimal UPDATED_FAT_G = new BigDecimal(1);

    private static final WorkoutType DEFAULT_WORKOUT_TYPE = WorkoutType.FBW;
    private static final WorkoutType UPDATED_WORKOUT_TYPE = WorkoutType.PPL;

    private static final BigDecimal DEFAULT_WORKOUT_INTENSITY = new BigDecimal(0);
    private static final BigDecimal UPDATED_WORKOUT_INTENSITY = new BigDecimal(1);

    private static final String DEFAULT_SOURCE = "AAAAAAAAAA";
    private static final String UPDATED_SOURCE = "BBBBBBBBBB";

    private static final Instant DEFAULT_CREATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_CREATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final String ENTITY_API_URL = "/api/plans";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private PlanMapper planMapper;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restPlanMockMvc;

    private Plan plan;

    private Plan insertedPlan;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Plan createEntity(EntityManager em) {
        Plan plan = new Plan()
            .caloriesKcal(DEFAULT_CALORIES_KCAL)
            .proteinG(DEFAULT_PROTEIN_G)
            .carbsG(DEFAULT_CARBS_G)
            .fatG(DEFAULT_FAT_G)
            .workoutType(DEFAULT_WORKOUT_TYPE)
            .workoutIntensity(DEFAULT_WORKOUT_INTENSITY)
            .source(DEFAULT_SOURCE)
            .createdAt(DEFAULT_CREATED_AT);
        // Add required entity
        UserProfile userProfile;
        if (TestUtil.findAll(em, UserProfile.class).isEmpty()) {
            userProfile = UserProfileResourceIT.createEntity(em);
            em.persist(userProfile);
            em.flush();
        } else {
            userProfile = TestUtil.findAll(em, UserProfile.class).get(0);
        }
        plan.setProfile(userProfile);
        return plan;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Plan createUpdatedEntity(EntityManager em) {
        Plan updatedPlan = new Plan()
            .caloriesKcal(UPDATED_CALORIES_KCAL)
            .proteinG(UPDATED_PROTEIN_G)
            .carbsG(UPDATED_CARBS_G)
            .fatG(UPDATED_FAT_G)
            .workoutType(UPDATED_WORKOUT_TYPE)
            .workoutIntensity(UPDATED_WORKOUT_INTENSITY)
            .source(UPDATED_SOURCE)
            .createdAt(UPDATED_CREATED_AT);
        // Add required entity
        UserProfile userProfile;
        if (TestUtil.findAll(em, UserProfile.class).isEmpty()) {
            userProfile = UserProfileResourceIT.createUpdatedEntity(em);
            em.persist(userProfile);
            em.flush();
        } else {
            userProfile = TestUtil.findAll(em, UserProfile.class).get(0);
        }
        updatedPlan.setProfile(userProfile);
        return updatedPlan;
    }

    @BeforeEach
    void initTest() {
        plan = createEntity(em);
    }

    @AfterEach
    void cleanup() {
        if (insertedPlan != null) {
            planRepository.delete(insertedPlan);
            insertedPlan = null;
        }
    }

    @Test
    @Transactional
    void createPlan() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Plan
        PlanDTO planDTO = planMapper.toDto(plan);
        var returnedPlanDTO = om.readValue(
            restPlanMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(planDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            PlanDTO.class
        );

        // Validate the Plan in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedPlan = planMapper.toEntity(returnedPlanDTO);
        assertPlanUpdatableFieldsEquals(returnedPlan, getPersistedPlan(returnedPlan));

        insertedPlan = returnedPlan;
    }

    @Test
    @Transactional
    void createPlanWithExistingId() throws Exception {
        // Create the Plan with an existing ID
        plan.setId(1L);
        PlanDTO planDTO = planMapper.toDto(plan);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restPlanMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(planDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Plan in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkCaloriesKcalIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        plan.setCaloriesKcal(null);

        // Create the Plan, which fails.
        PlanDTO planDTO = planMapper.toDto(plan);

        restPlanMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(planDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkProteinGIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        plan.setProteinG(null);

        // Create the Plan, which fails.
        PlanDTO planDTO = planMapper.toDto(plan);

        restPlanMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(planDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkCarbsGIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        plan.setCarbsG(null);

        // Create the Plan, which fails.
        PlanDTO planDTO = planMapper.toDto(plan);

        restPlanMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(planDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkFatGIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        plan.setFatG(null);

        // Create the Plan, which fails.
        PlanDTO planDTO = planMapper.toDto(plan);

        restPlanMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(planDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkSourceIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        plan.setSource(null);

        // Create the Plan, which fails.
        PlanDTO planDTO = planMapper.toDto(plan);

        restPlanMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(planDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkCreatedAtIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        plan.setCreatedAt(null);

        // Create the Plan, which fails.
        PlanDTO planDTO = planMapper.toDto(plan);

        restPlanMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(planDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllPlans() throws Exception {
        // Initialize the database
        insertedPlan = planRepository.saveAndFlush(plan);

        // Get all the planList
        restPlanMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(plan.getId().intValue())))
            .andExpect(jsonPath("$.[*].caloriesKcal").value(hasItem(DEFAULT_CALORIES_KCAL)))
            .andExpect(jsonPath("$.[*].proteinG").value(hasItem(sameNumber(DEFAULT_PROTEIN_G))))
            .andExpect(jsonPath("$.[*].carbsG").value(hasItem(sameNumber(DEFAULT_CARBS_G))))
            .andExpect(jsonPath("$.[*].fatG").value(hasItem(sameNumber(DEFAULT_FAT_G))))
            .andExpect(jsonPath("$.[*].workoutType").value(hasItem(DEFAULT_WORKOUT_TYPE.toString())))
            .andExpect(jsonPath("$.[*].workoutIntensity").value(hasItem(sameNumber(DEFAULT_WORKOUT_INTENSITY))))
            .andExpect(jsonPath("$.[*].source").value(hasItem(DEFAULT_SOURCE)))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())));
    }

    @Test
    @Transactional
    void getPlan() throws Exception {
        // Initialize the database
        insertedPlan = planRepository.saveAndFlush(plan);

        // Get the plan
        restPlanMockMvc
            .perform(get(ENTITY_API_URL_ID, plan.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(plan.getId().intValue()))
            .andExpect(jsonPath("$.caloriesKcal").value(DEFAULT_CALORIES_KCAL))
            .andExpect(jsonPath("$.proteinG").value(sameNumber(DEFAULT_PROTEIN_G)))
            .andExpect(jsonPath("$.carbsG").value(sameNumber(DEFAULT_CARBS_G)))
            .andExpect(jsonPath("$.fatG").value(sameNumber(DEFAULT_FAT_G)))
            .andExpect(jsonPath("$.workoutType").value(DEFAULT_WORKOUT_TYPE.toString()))
            .andExpect(jsonPath("$.workoutIntensity").value(sameNumber(DEFAULT_WORKOUT_INTENSITY)))
            .andExpect(jsonPath("$.source").value(DEFAULT_SOURCE))
            .andExpect(jsonPath("$.createdAt").value(DEFAULT_CREATED_AT.toString()));
    }

    @Test
    @Transactional
    void getNonExistingPlan() throws Exception {
        // Get the plan
        restPlanMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingPlan() throws Exception {
        // Initialize the database
        insertedPlan = planRepository.saveAndFlush(plan);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the plan
        Plan updatedPlan = planRepository.findById(plan.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedPlan are not directly saved in db
        em.detach(updatedPlan);
        updatedPlan
            .caloriesKcal(UPDATED_CALORIES_KCAL)
            .proteinG(UPDATED_PROTEIN_G)
            .carbsG(UPDATED_CARBS_G)
            .fatG(UPDATED_FAT_G)
            .workoutType(UPDATED_WORKOUT_TYPE)
            .workoutIntensity(UPDATED_WORKOUT_INTENSITY)
            .source(UPDATED_SOURCE)
            .createdAt(UPDATED_CREATED_AT);
        PlanDTO planDTO = planMapper.toDto(updatedPlan);

        restPlanMockMvc
            .perform(put(ENTITY_API_URL_ID, planDTO.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(planDTO)))
            .andExpect(status().isOk());

        // Validate the Plan in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedPlanToMatchAllProperties(updatedPlan);
    }

    @Test
    @Transactional
    void putNonExistingPlan() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        plan.setId(longCount.incrementAndGet());

        // Create the Plan
        PlanDTO planDTO = planMapper.toDto(plan);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restPlanMockMvc
            .perform(put(ENTITY_API_URL_ID, planDTO.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(planDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Plan in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchPlan() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        plan.setId(longCount.incrementAndGet());

        // Create the Plan
        PlanDTO planDTO = planMapper.toDto(plan);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPlanMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(planDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Plan in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamPlan() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        plan.setId(longCount.incrementAndGet());

        // Create the Plan
        PlanDTO planDTO = planMapper.toDto(plan);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPlanMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(planDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Plan in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdatePlanWithPatch() throws Exception {
        // Initialize the database
        insertedPlan = planRepository.saveAndFlush(plan);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the plan using partial update
        Plan partialUpdatedPlan = new Plan();
        partialUpdatedPlan.setId(plan.getId());

        partialUpdatedPlan.carbsG(UPDATED_CARBS_G).workoutIntensity(UPDATED_WORKOUT_INTENSITY);

        restPlanMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedPlan.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedPlan))
            )
            .andExpect(status().isOk());

        // Validate the Plan in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPlanUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedPlan, plan), getPersistedPlan(plan));
    }

    @Test
    @Transactional
    void fullUpdatePlanWithPatch() throws Exception {
        // Initialize the database
        insertedPlan = planRepository.saveAndFlush(plan);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the plan using partial update
        Plan partialUpdatedPlan = new Plan();
        partialUpdatedPlan.setId(plan.getId());

        partialUpdatedPlan
            .caloriesKcal(UPDATED_CALORIES_KCAL)
            .proteinG(UPDATED_PROTEIN_G)
            .carbsG(UPDATED_CARBS_G)
            .fatG(UPDATED_FAT_G)
            .workoutType(UPDATED_WORKOUT_TYPE)
            .workoutIntensity(UPDATED_WORKOUT_INTENSITY)
            .source(UPDATED_SOURCE)
            .createdAt(UPDATED_CREATED_AT);

        restPlanMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedPlan.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedPlan))
            )
            .andExpect(status().isOk());

        // Validate the Plan in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPlanUpdatableFieldsEquals(partialUpdatedPlan, getPersistedPlan(partialUpdatedPlan));
    }

    @Test
    @Transactional
    void patchNonExistingPlan() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        plan.setId(longCount.incrementAndGet());

        // Create the Plan
        PlanDTO planDTO = planMapper.toDto(plan);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restPlanMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, planDTO.getId()).contentType("application/merge-patch+json").content(om.writeValueAsBytes(planDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Plan in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchPlan() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        plan.setId(longCount.incrementAndGet());

        // Create the Plan
        PlanDTO planDTO = planMapper.toDto(plan);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPlanMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(planDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Plan in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamPlan() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        plan.setId(longCount.incrementAndGet());

        // Create the Plan
        PlanDTO planDTO = planMapper.toDto(plan);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPlanMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(planDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Plan in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deletePlan() throws Exception {
        // Initialize the database
        insertedPlan = planRepository.saveAndFlush(plan);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the plan
        restPlanMockMvc
            .perform(delete(ENTITY_API_URL_ID, plan.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return planRepository.count();
    }

    protected void assertIncrementedRepositoryCount(long countBefore) {
        assertThat(countBefore + 1).isEqualTo(getRepositoryCount());
    }

    protected void assertDecrementedRepositoryCount(long countBefore) {
        assertThat(countBefore - 1).isEqualTo(getRepositoryCount());
    }

    protected void assertSameRepositoryCount(long countBefore) {
        assertThat(countBefore).isEqualTo(getRepositoryCount());
    }

    protected Plan getPersistedPlan(Plan plan) {
        return planRepository.findById(plan.getId()).orElseThrow();
    }

    protected void assertPersistedPlanToMatchAllProperties(Plan expectedPlan) {
        assertPlanAllPropertiesEquals(expectedPlan, getPersistedPlan(expectedPlan));
    }

    protected void assertPersistedPlanToMatchUpdatableProperties(Plan expectedPlan) {
        assertPlanAllUpdatablePropertiesEquals(expectedPlan, getPersistedPlan(expectedPlan));
    }
}
