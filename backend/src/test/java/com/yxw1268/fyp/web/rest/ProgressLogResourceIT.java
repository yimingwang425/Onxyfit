package com.yxw1268.fyp.web.rest;

import static com.yxw1268.fyp.domain.ProgressLogAsserts.*;
import static com.yxw1268.fyp.web.rest.TestUtil.createUpdateProxyForBean;
import static com.yxw1268.fyp.web.rest.TestUtil.sameNumber;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yxw1268.fyp.IntegrationTest;
import com.yxw1268.fyp.domain.ProgressLog;
import com.yxw1268.fyp.domain.UserProfile;
import com.yxw1268.fyp.repository.ProgressLogRepository;
import com.yxw1268.fyp.service.dto.ProgressLogDTO;
import com.yxw1268.fyp.service.mapper.ProgressLogMapper;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
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
 * Integration tests for the {@link ProgressLogResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class ProgressLogResourceIT {

    private static final LocalDate DEFAULT_LOG_DATE = LocalDate.ofEpochDay(0L);
    private static final LocalDate UPDATED_LOG_DATE = LocalDate.now(ZoneId.systemDefault());

    private static final BigDecimal DEFAULT_WEIGHT_KG = new BigDecimal(1);
    private static final BigDecimal UPDATED_WEIGHT_KG = new BigDecimal(2);

    private static final Boolean DEFAULT_COMPLETED_WORKOUT = false;
    private static final Boolean UPDATED_COMPLETED_WORKOUT = true;

    private static final Integer DEFAULT_CALORIES_INTAKE = 0;
    private static final Integer UPDATED_CALORIES_INTAKE = 1;

    private static final Integer DEFAULT_STEPS = 0;
    private static final Integer UPDATED_STEPS = 1;

    private static final String DEFAULT_NOTES = "AAAAAAAAAA";
    private static final String UPDATED_NOTES = "BBBBBBBBBB";

    private static final Instant DEFAULT_CREATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_CREATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final String ENTITY_API_URL = "/api/progress-logs";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private ProgressLogRepository progressLogRepository;

    @Autowired
    private ProgressLogMapper progressLogMapper;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restProgressLogMockMvc;

    private ProgressLog progressLog;

    private ProgressLog insertedProgressLog;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static ProgressLog createEntity(EntityManager em) {
        ProgressLog progressLog = new ProgressLog()
            .logDate(DEFAULT_LOG_DATE)
            .weightKg(DEFAULT_WEIGHT_KG)
            .completedWorkout(DEFAULT_COMPLETED_WORKOUT)
            .caloriesIntake(DEFAULT_CALORIES_INTAKE)
            .steps(DEFAULT_STEPS)
            .notes(DEFAULT_NOTES)
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
        progressLog.setProfile(userProfile);
        return progressLog;
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static ProgressLog createUpdatedEntity(EntityManager em) {
        ProgressLog updatedProgressLog = new ProgressLog()
            .logDate(UPDATED_LOG_DATE)
            .weightKg(UPDATED_WEIGHT_KG)
            .completedWorkout(UPDATED_COMPLETED_WORKOUT)
            .caloriesIntake(UPDATED_CALORIES_INTAKE)
            .steps(UPDATED_STEPS)
            .notes(UPDATED_NOTES)
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
        updatedProgressLog.setProfile(userProfile);
        return updatedProgressLog;
    }

    @BeforeEach
    void initTest() {
        progressLog = createEntity(em);
    }

    @AfterEach
    void cleanup() {
        if (insertedProgressLog != null) {
            progressLogRepository.delete(insertedProgressLog);
            insertedProgressLog = null;
        }
    }

    @Test
    @Transactional
    void createProgressLog() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the ProgressLog
        ProgressLogDTO progressLogDTO = progressLogMapper.toDto(progressLog);
        var returnedProgressLogDTO = om.readValue(
            restProgressLogMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(progressLogDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            ProgressLogDTO.class
        );

        // Validate the ProgressLog in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedProgressLog = progressLogMapper.toEntity(returnedProgressLogDTO);
        assertProgressLogUpdatableFieldsEquals(returnedProgressLog, getPersistedProgressLog(returnedProgressLog));

        insertedProgressLog = returnedProgressLog;
    }

    @Test
    @Transactional
    void createProgressLogWithExistingId() throws Exception {
        // Create the ProgressLog with an existing ID
        progressLog.setId(1L);
        ProgressLogDTO progressLogDTO = progressLogMapper.toDto(progressLog);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restProgressLogMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(progressLogDTO)))
            .andExpect(status().isBadRequest());

        // Validate the ProgressLog in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkLogDateIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        progressLog.setLogDate(null);

        // Create the ProgressLog, which fails.
        ProgressLogDTO progressLogDTO = progressLogMapper.toDto(progressLog);

        restProgressLogMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(progressLogDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkCompletedWorkoutIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        progressLog.setCompletedWorkout(null);

        // Create the ProgressLog, which fails.
        ProgressLogDTO progressLogDTO = progressLogMapper.toDto(progressLog);

        restProgressLogMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(progressLogDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkCreatedAtIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        progressLog.setCreatedAt(null);

        // Create the ProgressLog, which fails.
        ProgressLogDTO progressLogDTO = progressLogMapper.toDto(progressLog);

        restProgressLogMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(progressLogDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllProgressLogs() throws Exception {
        // Initialize the database
        insertedProgressLog = progressLogRepository.saveAndFlush(progressLog);

        // Get all the progressLogList
        restProgressLogMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(progressLog.getId().intValue())))
            .andExpect(jsonPath("$.[*].logDate").value(hasItem(DEFAULT_LOG_DATE.toString())))
            .andExpect(jsonPath("$.[*].weightKg").value(hasItem(sameNumber(DEFAULT_WEIGHT_KG))))
            .andExpect(jsonPath("$.[*].completedWorkout").value(hasItem(DEFAULT_COMPLETED_WORKOUT)))
            .andExpect(jsonPath("$.[*].caloriesIntake").value(hasItem(DEFAULT_CALORIES_INTAKE)))
            .andExpect(jsonPath("$.[*].steps").value(hasItem(DEFAULT_STEPS)))
            .andExpect(jsonPath("$.[*].notes").value(hasItem(DEFAULT_NOTES)))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())));
    }

    @Test
    @Transactional
    void getProgressLog() throws Exception {
        // Initialize the database
        insertedProgressLog = progressLogRepository.saveAndFlush(progressLog);

        // Get the progressLog
        restProgressLogMockMvc
            .perform(get(ENTITY_API_URL_ID, progressLog.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(progressLog.getId().intValue()))
            .andExpect(jsonPath("$.logDate").value(DEFAULT_LOG_DATE.toString()))
            .andExpect(jsonPath("$.weightKg").value(sameNumber(DEFAULT_WEIGHT_KG)))
            .andExpect(jsonPath("$.completedWorkout").value(DEFAULT_COMPLETED_WORKOUT))
            .andExpect(jsonPath("$.caloriesIntake").value(DEFAULT_CALORIES_INTAKE))
            .andExpect(jsonPath("$.steps").value(DEFAULT_STEPS))
            .andExpect(jsonPath("$.notes").value(DEFAULT_NOTES))
            .andExpect(jsonPath("$.createdAt").value(DEFAULT_CREATED_AT.toString()));
    }

    @Test
    @Transactional
    void getNonExistingProgressLog() throws Exception {
        // Get the progressLog
        restProgressLogMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingProgressLog() throws Exception {
        // Initialize the database
        insertedProgressLog = progressLogRepository.saveAndFlush(progressLog);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the progressLog
        ProgressLog updatedProgressLog = progressLogRepository.findById(progressLog.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedProgressLog are not directly saved in db
        em.detach(updatedProgressLog);
        updatedProgressLog
            .logDate(UPDATED_LOG_DATE)
            .weightKg(UPDATED_WEIGHT_KG)
            .completedWorkout(UPDATED_COMPLETED_WORKOUT)
            .caloriesIntake(UPDATED_CALORIES_INTAKE)
            .steps(UPDATED_STEPS)
            .notes(UPDATED_NOTES)
            .createdAt(UPDATED_CREATED_AT);
        ProgressLogDTO progressLogDTO = progressLogMapper.toDto(updatedProgressLog);

        restProgressLogMockMvc
            .perform(
                put(ENTITY_API_URL_ID, progressLogDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(progressLogDTO))
            )
            .andExpect(status().isOk());

        // Validate the ProgressLog in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedProgressLogToMatchAllProperties(updatedProgressLog);
    }

    @Test
    @Transactional
    void putNonExistingProgressLog() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        progressLog.setId(longCount.incrementAndGet());

        // Create the ProgressLog
        ProgressLogDTO progressLogDTO = progressLogMapper.toDto(progressLog);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restProgressLogMockMvc
            .perform(
                put(ENTITY_API_URL_ID, progressLogDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(progressLogDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the ProgressLog in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchProgressLog() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        progressLog.setId(longCount.incrementAndGet());

        // Create the ProgressLog
        ProgressLogDTO progressLogDTO = progressLogMapper.toDto(progressLog);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restProgressLogMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(progressLogDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the ProgressLog in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamProgressLog() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        progressLog.setId(longCount.incrementAndGet());

        // Create the ProgressLog
        ProgressLogDTO progressLogDTO = progressLogMapper.toDto(progressLog);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restProgressLogMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(progressLogDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the ProgressLog in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateProgressLogWithPatch() throws Exception {
        // Initialize the database
        insertedProgressLog = progressLogRepository.saveAndFlush(progressLog);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the progressLog using partial update
        ProgressLog partialUpdatedProgressLog = new ProgressLog();
        partialUpdatedProgressLog.setId(progressLog.getId());

        partialUpdatedProgressLog
            .completedWorkout(UPDATED_COMPLETED_WORKOUT)
            .caloriesIntake(UPDATED_CALORIES_INTAKE)
            .steps(UPDATED_STEPS)
            .notes(UPDATED_NOTES);

        restProgressLogMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedProgressLog.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedProgressLog))
            )
            .andExpect(status().isOk());

        // Validate the ProgressLog in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertProgressLogUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedProgressLog, progressLog),
            getPersistedProgressLog(progressLog)
        );
    }

    @Test
    @Transactional
    void fullUpdateProgressLogWithPatch() throws Exception {
        // Initialize the database
        insertedProgressLog = progressLogRepository.saveAndFlush(progressLog);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the progressLog using partial update
        ProgressLog partialUpdatedProgressLog = new ProgressLog();
        partialUpdatedProgressLog.setId(progressLog.getId());

        partialUpdatedProgressLog
            .logDate(UPDATED_LOG_DATE)
            .weightKg(UPDATED_WEIGHT_KG)
            .completedWorkout(UPDATED_COMPLETED_WORKOUT)
            .caloriesIntake(UPDATED_CALORIES_INTAKE)
            .steps(UPDATED_STEPS)
            .notes(UPDATED_NOTES)
            .createdAt(UPDATED_CREATED_AT);

        restProgressLogMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedProgressLog.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedProgressLog))
            )
            .andExpect(status().isOk());

        // Validate the ProgressLog in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertProgressLogUpdatableFieldsEquals(partialUpdatedProgressLog, getPersistedProgressLog(partialUpdatedProgressLog));
    }

    @Test
    @Transactional
    void patchNonExistingProgressLog() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        progressLog.setId(longCount.incrementAndGet());

        // Create the ProgressLog
        ProgressLogDTO progressLogDTO = progressLogMapper.toDto(progressLog);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restProgressLogMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, progressLogDTO.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(progressLogDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the ProgressLog in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchProgressLog() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        progressLog.setId(longCount.incrementAndGet());

        // Create the ProgressLog
        ProgressLogDTO progressLogDTO = progressLogMapper.toDto(progressLog);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restProgressLogMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(progressLogDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the ProgressLog in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamProgressLog() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        progressLog.setId(longCount.incrementAndGet());

        // Create the ProgressLog
        ProgressLogDTO progressLogDTO = progressLogMapper.toDto(progressLog);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restProgressLogMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(progressLogDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the ProgressLog in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteProgressLog() throws Exception {
        // Initialize the database
        insertedProgressLog = progressLogRepository.saveAndFlush(progressLog);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the progressLog
        restProgressLogMockMvc
            .perform(delete(ENTITY_API_URL_ID, progressLog.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return progressLogRepository.count();
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

    protected ProgressLog getPersistedProgressLog(ProgressLog progressLog) {
        return progressLogRepository.findById(progressLog.getId()).orElseThrow();
    }

    protected void assertPersistedProgressLogToMatchAllProperties(ProgressLog expectedProgressLog) {
        assertProgressLogAllPropertiesEquals(expectedProgressLog, getPersistedProgressLog(expectedProgressLog));
    }

    protected void assertPersistedProgressLogToMatchUpdatableProperties(ProgressLog expectedProgressLog) {
        assertProgressLogAllUpdatablePropertiesEquals(expectedProgressLog, getPersistedProgressLog(expectedProgressLog));
    }
}
