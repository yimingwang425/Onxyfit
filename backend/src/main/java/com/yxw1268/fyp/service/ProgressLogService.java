package com.yxw1268.fyp.service;

import com.yxw1268.fyp.domain.ProgressLog;
import com.yxw1268.fyp.domain.UserProfile;
import com.yxw1268.fyp.repository.ProgressLogRepository;
import com.yxw1268.fyp.repository.UserProfileRepository;
import com.yxw1268.fyp.service.dto.ProgressLogDTO;
import com.yxw1268.fyp.service.mapper.ProgressLogMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
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

    private final UserProfileRepository userProfileRepository;

    public ProgressLogService(
        ProgressLogRepository progressLogRepository,
        ProgressLogMapper progressLogMapper,
        UserProfileRepository userProfileRepository
    ) {
        this.userProfileRepository = userProfileRepository;
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
     * Get the progressLogs belonging to one user.
     *
     * @param login the login of the owner.
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<ProgressLogDTO> findAllForUser(String login, Pageable pageable) {
        LOG.debug("Request to get ProgressLogs of user {}", login);
        return progressLogRepository.findAllByProfile_User_Login(login, pageable).map(progressLogMapper::toDto);
    }

    /**
     * Record a check-in for one day, creating that day's log or updating it. Fields left null keep
     * their stored value. A logged weight also becomes the profile's current weight.
     */
    public ProgressLogDTO checkIn(UserProfile profile, LocalDate date, BigDecimal weightKg, Boolean completedWorkout) {
        ProgressLog log = progressLogRepository
            .findFirstByProfileIdAndLogDateOrderByIdAsc(profile.getId(), date)
            .orElseGet(() -> {
                ProgressLog created = new ProgressLog();
                created.setProfile(profile);
                created.setLogDate(date);
                created.setCompletedWorkout(false);
                created.setCreatedAt(Instant.now());
                return created;
            });

        if (weightKg != null) {
            log.setWeightKg(weightKg);
            profile.setWeightKg(weightKg);
            userProfileRepository.save(profile);
        }
        if (completedWorkout != null) {
            log.setCompletedWorkout(completedWorkout);
        }
        return progressLogMapper.toDto(progressLogRepository.save(log));
    }

    /**
     * The check-ins of a profile from the given day on, oldest first.
     */
    @Transactional(readOnly = true)
    public List<ProgressLogDTO> findSince(Long profileId, LocalDate from) {
        return progressLogRepository
            .findAllByProfileIdAndLogDateGreaterThanEqualOrderByLogDateAsc(profileId, from)
            .stream()
            .map(progressLogMapper::toDto)
            .toList();
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
