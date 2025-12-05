package com.yxw1268.fyp.service;

import com.yxw1268.fyp.domain.ProgressLog;
import com.yxw1268.fyp.repository.ProgressLogRepository;
import com.yxw1268.fyp.service.dto.ProgressLogDTO;
import com.yxw1268.fyp.service.mapper.ProgressLogMapper;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.yxw1268.fyp.domain.ProgressLog}.
 */
@Service
@Transactional
public class ProgressLogService {

    private static final Logger LOG = LoggerFactory.getLogger(ProgressLogService.class);

    private final ProgressLogRepository progressLogRepository;

    private final ProgressLogMapper progressLogMapper;

    public ProgressLogService(ProgressLogRepository progressLogRepository, ProgressLogMapper progressLogMapper) {
        this.progressLogRepository = progressLogRepository;
        this.progressLogMapper = progressLogMapper;
    }

    /**
     * Save a progressLog.
     *
     * @param progressLogDTO the entity to save.
     * @return the persisted entity.
     */
    public ProgressLogDTO save(ProgressLogDTO progressLogDTO) {
        LOG.debug("Request to save ProgressLog : {}", progressLogDTO);
        ProgressLog progressLog = progressLogMapper.toEntity(progressLogDTO);
        progressLog = progressLogRepository.save(progressLog);
        return progressLogMapper.toDto(progressLog);
    }

    /**
     * Update a progressLog.
     *
     * @param progressLogDTO the entity to save.
     * @return the persisted entity.
     */
    public ProgressLogDTO update(ProgressLogDTO progressLogDTO) {
        LOG.debug("Request to update ProgressLog : {}", progressLogDTO);
        ProgressLog progressLog = progressLogMapper.toEntity(progressLogDTO);
        progressLog = progressLogRepository.save(progressLog);
        return progressLogMapper.toDto(progressLog);
    }

    /**
     * Partially update a progressLog.
     *
     * @param progressLogDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<ProgressLogDTO> partialUpdate(ProgressLogDTO progressLogDTO) {
        LOG.debug("Request to partially update ProgressLog : {}", progressLogDTO);

        return progressLogRepository
            .findById(progressLogDTO.getId())
            .map(existingProgressLog -> {
                progressLogMapper.partialUpdate(existingProgressLog, progressLogDTO);

                return existingProgressLog;
            })
            .map(progressLogRepository::save)
            .map(progressLogMapper::toDto);
    }

    /**
     * Get all the progressLogs.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<ProgressLogDTO> findAll(Pageable pageable) {
        LOG.debug("Request to get all ProgressLogs");
        return progressLogRepository.findAll(pageable).map(progressLogMapper::toDto);
    }

    /**
     * Get one progressLog by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<ProgressLogDTO> findOne(Long id) {
        LOG.debug("Request to get ProgressLog : {}", id);
        return progressLogRepository.findById(id).map(progressLogMapper::toDto);
    }

    /**
     * Delete the progressLog by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete ProgressLog : {}", id);
        progressLogRepository.deleteById(id);
    }
}
