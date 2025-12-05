package com.yxw1268.fyp.service;

import com.yxw1268.fyp.domain.OtpRecord;
import com.yxw1268.fyp.repository.OtpRecordRepository;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.yxw1268.fyp.domain.OtpRecord}.
 */
@Service
@Transactional
public class OtpRecordService {

    private static final Logger LOG = LoggerFactory.getLogger(OtpRecordService.class);

    private final OtpRecordRepository otpRecordRepository;

    public OtpRecordService(OtpRecordRepository otpRecordRepository) {
        this.otpRecordRepository = otpRecordRepository;
    }

    /**
     * Save a otpRecord.
     *
     * @param otpRecord the entity to save.
     * @return the persisted entity.
     */
    public OtpRecord save(OtpRecord otpRecord) {
        LOG.debug("Request to save OtpRecord : {}", otpRecord);
        return otpRecordRepository.save(otpRecord);
    }

    /**
     * Update a otpRecord.
     *
     * @param otpRecord the entity to save.
     * @return the persisted entity.
     */
    public OtpRecord update(OtpRecord otpRecord) {
        LOG.debug("Request to update OtpRecord : {}", otpRecord);
        return otpRecordRepository.save(otpRecord);
    }

    /**
     * Partially update a otpRecord.
     *
     * @param otpRecord the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<OtpRecord> partialUpdate(OtpRecord otpRecord) {
        LOG.debug("Request to partially update OtpRecord : {}", otpRecord);

        return otpRecordRepository
            .findById(otpRecord.getId())
            .map(existingOtpRecord -> {
                if (otpRecord.getEmail() != null) {
                    existingOtpRecord.setEmail(otpRecord.getEmail());
                }
                if (otpRecord.getOtpCode() != null) {
                    existingOtpRecord.setOtpCode(otpRecord.getOtpCode());
                }
                if (otpRecord.getExpiryTime() != null) {
                    existingOtpRecord.setExpiryTime(otpRecord.getExpiryTime());
                }
                if (otpRecord.getVerified() != null) {
                    existingOtpRecord.setVerified(otpRecord.getVerified());
                }

                return existingOtpRecord;
            })
            .map(otpRecordRepository::save);
    }

    /**
     * Get all the otpRecords.
     *
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public List<OtpRecord> findAll() {
        LOG.debug("Request to get all OtpRecords");
        return otpRecordRepository.findAll();
    }

    /**
     * Get one otpRecord by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<OtpRecord> findOne(Long id) {
        LOG.debug("Request to get OtpRecord : {}", id);
        return otpRecordRepository.findById(id);
    }

    /**
     * Delete the otpRecord by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete OtpRecord : {}", id);
        otpRecordRepository.deleteById(id);
    }
}
