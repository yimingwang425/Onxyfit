package com.yxw1268.fyp.web.rest;

import static com.yxw1268.fyp.domain.OtpRecordAsserts.*;
import static com.yxw1268.fyp.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yxw1268.fyp.IntegrationTest;
import com.yxw1268.fyp.domain.OtpRecord;
import com.yxw1268.fyp.repository.OtpRecordRepository;
import jakarta.persistence.EntityManager;
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
 * Integration tests for the {@link OtpRecordResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class OtpRecordResourceIT {

    private static final String DEFAULT_EMAIL = "AAAAAAAAAA";
    private static final String UPDATED_EMAIL = "BBBBBBBBBB";

    private static final String DEFAULT_OTP_CODE = "AAAAAAAAAA";
    private static final String UPDATED_OTP_CODE = "BBBBBBBBBB";

    private static final Instant DEFAULT_EXPIRY_TIME = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_EXPIRY_TIME = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final Boolean DEFAULT_VERIFIED = false;
    private static final Boolean UPDATED_VERIFIED = true;

    private static final String ENTITY_API_URL = "/api/otp-records";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private OtpRecordRepository otpRecordRepository;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restOtpRecordMockMvc;

    private OtpRecord otpRecord;

    private OtpRecord insertedOtpRecord;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static OtpRecord createEntity() {
        return new OtpRecord().email(DEFAULT_EMAIL).otpCode(DEFAULT_OTP_CODE).expiryTime(DEFAULT_EXPIRY_TIME).verified(DEFAULT_VERIFIED);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static OtpRecord createUpdatedEntity() {
        return new OtpRecord().email(UPDATED_EMAIL).otpCode(UPDATED_OTP_CODE).expiryTime(UPDATED_EXPIRY_TIME).verified(UPDATED_VERIFIED);
    }

    @BeforeEach
    void initTest() {
        otpRecord = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedOtpRecord != null) {
            otpRecordRepository.delete(insertedOtpRecord);
            insertedOtpRecord = null;
        }
    }

    @Test
    @Transactional
    void createOtpRecord() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the OtpRecord
        var returnedOtpRecord = om.readValue(
            restOtpRecordMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(otpRecord)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            OtpRecord.class
        );

        // Validate the OtpRecord in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        assertOtpRecordUpdatableFieldsEquals(returnedOtpRecord, getPersistedOtpRecord(returnedOtpRecord));

        insertedOtpRecord = returnedOtpRecord;
    }

    @Test
    @Transactional
    void createOtpRecordWithExistingId() throws Exception {
        // Create the OtpRecord with an existing ID
        otpRecord.setId(1L);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restOtpRecordMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(otpRecord)))
            .andExpect(status().isBadRequest());

        // Validate the OtpRecord in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkEmailIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        otpRecord.setEmail(null);

        // Create the OtpRecord, which fails.

        restOtpRecordMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(otpRecord)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkOtpCodeIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        otpRecord.setOtpCode(null);

        // Create the OtpRecord, which fails.

        restOtpRecordMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(otpRecord)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkExpiryTimeIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        otpRecord.setExpiryTime(null);

        // Create the OtpRecord, which fails.

        restOtpRecordMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(otpRecord)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllOtpRecords() throws Exception {
        // Initialize the database
        insertedOtpRecord = otpRecordRepository.saveAndFlush(otpRecord);

        // Get all the otpRecordList
        restOtpRecordMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(otpRecord.getId().intValue())))
            .andExpect(jsonPath("$.[*].email").value(hasItem(DEFAULT_EMAIL)))
            .andExpect(jsonPath("$.[*].otpCode").value(hasItem(DEFAULT_OTP_CODE)))
            .andExpect(jsonPath("$.[*].expiryTime").value(hasItem(DEFAULT_EXPIRY_TIME.toString())))
            .andExpect(jsonPath("$.[*].verified").value(hasItem(DEFAULT_VERIFIED)));
    }

    @Test
    @Transactional
    void getOtpRecord() throws Exception {
        // Initialize the database
        insertedOtpRecord = otpRecordRepository.saveAndFlush(otpRecord);

        // Get the otpRecord
        restOtpRecordMockMvc
            .perform(get(ENTITY_API_URL_ID, otpRecord.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(otpRecord.getId().intValue()))
            .andExpect(jsonPath("$.email").value(DEFAULT_EMAIL))
            .andExpect(jsonPath("$.otpCode").value(DEFAULT_OTP_CODE))
            .andExpect(jsonPath("$.expiryTime").value(DEFAULT_EXPIRY_TIME.toString()))
            .andExpect(jsonPath("$.verified").value(DEFAULT_VERIFIED));
    }

    @Test
    @Transactional
    void getNonExistingOtpRecord() throws Exception {
        // Get the otpRecord
        restOtpRecordMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingOtpRecord() throws Exception {
        // Initialize the database
        insertedOtpRecord = otpRecordRepository.saveAndFlush(otpRecord);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the otpRecord
        OtpRecord updatedOtpRecord = otpRecordRepository.findById(otpRecord.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedOtpRecord are not directly saved in db
        em.detach(updatedOtpRecord);
        updatedOtpRecord.email(UPDATED_EMAIL).otpCode(UPDATED_OTP_CODE).expiryTime(UPDATED_EXPIRY_TIME).verified(UPDATED_VERIFIED);

        restOtpRecordMockMvc
            .perform(
                put(ENTITY_API_URL_ID, updatedOtpRecord.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(updatedOtpRecord))
            )
            .andExpect(status().isOk());

        // Validate the OtpRecord in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedOtpRecordToMatchAllProperties(updatedOtpRecord);
    }

    @Test
    @Transactional
    void putNonExistingOtpRecord() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        otpRecord.setId(longCount.incrementAndGet());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restOtpRecordMockMvc
            .perform(
                put(ENTITY_API_URL_ID, otpRecord.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(otpRecord))
            )
            .andExpect(status().isBadRequest());

        // Validate the OtpRecord in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchOtpRecord() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        otpRecord.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restOtpRecordMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(otpRecord))
            )
            .andExpect(status().isBadRequest());

        // Validate the OtpRecord in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamOtpRecord() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        otpRecord.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restOtpRecordMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(otpRecord)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the OtpRecord in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateOtpRecordWithPatch() throws Exception {
        // Initialize the database
        insertedOtpRecord = otpRecordRepository.saveAndFlush(otpRecord);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the otpRecord using partial update
        OtpRecord partialUpdatedOtpRecord = new OtpRecord();
        partialUpdatedOtpRecord.setId(otpRecord.getId());

        partialUpdatedOtpRecord.otpCode(UPDATED_OTP_CODE);

        restOtpRecordMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedOtpRecord.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedOtpRecord))
            )
            .andExpect(status().isOk());

        // Validate the OtpRecord in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertOtpRecordUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedOtpRecord, otpRecord),
            getPersistedOtpRecord(otpRecord)
        );
    }

    @Test
    @Transactional
    void fullUpdateOtpRecordWithPatch() throws Exception {
        // Initialize the database
        insertedOtpRecord = otpRecordRepository.saveAndFlush(otpRecord);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the otpRecord using partial update
        OtpRecord partialUpdatedOtpRecord = new OtpRecord();
        partialUpdatedOtpRecord.setId(otpRecord.getId());

        partialUpdatedOtpRecord.email(UPDATED_EMAIL).otpCode(UPDATED_OTP_CODE).expiryTime(UPDATED_EXPIRY_TIME).verified(UPDATED_VERIFIED);

        restOtpRecordMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedOtpRecord.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedOtpRecord))
            )
            .andExpect(status().isOk());

        // Validate the OtpRecord in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertOtpRecordUpdatableFieldsEquals(partialUpdatedOtpRecord, getPersistedOtpRecord(partialUpdatedOtpRecord));
    }

    @Test
    @Transactional
    void patchNonExistingOtpRecord() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        otpRecord.setId(longCount.incrementAndGet());

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restOtpRecordMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, otpRecord.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(otpRecord))
            )
            .andExpect(status().isBadRequest());

        // Validate the OtpRecord in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchOtpRecord() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        otpRecord.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restOtpRecordMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(otpRecord))
            )
            .andExpect(status().isBadRequest());

        // Validate the OtpRecord in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamOtpRecord() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        otpRecord.setId(longCount.incrementAndGet());

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restOtpRecordMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(otpRecord)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the OtpRecord in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteOtpRecord() throws Exception {
        // Initialize the database
        insertedOtpRecord = otpRecordRepository.saveAndFlush(otpRecord);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the otpRecord
        restOtpRecordMockMvc
            .perform(delete(ENTITY_API_URL_ID, otpRecord.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return otpRecordRepository.count();
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

    protected OtpRecord getPersistedOtpRecord(OtpRecord otpRecord) {
        return otpRecordRepository.findById(otpRecord.getId()).orElseThrow();
    }

    protected void assertPersistedOtpRecordToMatchAllProperties(OtpRecord expectedOtpRecord) {
        assertOtpRecordAllPropertiesEquals(expectedOtpRecord, getPersistedOtpRecord(expectedOtpRecord));
    }

    protected void assertPersistedOtpRecordToMatchUpdatableProperties(OtpRecord expectedOtpRecord) {
        assertOtpRecordAllUpdatablePropertiesEquals(expectedOtpRecord, getPersistedOtpRecord(expectedOtpRecord));
    }
}
