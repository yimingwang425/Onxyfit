package com.yxw1268.fyp.repository;

import com.yxw1268.fyp.domain.ProgressLog;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the ProgressLog entity.
 */
@SuppressWarnings("unused")
@Repository
public interface ProgressLogRepository extends JpaRepository<ProgressLog, Long> {

    void deleteAllByProfileId(Long profileId);

    Page<ProgressLog> findAllByProfile_User_Login(String login, Pageable pageable);

    boolean existsByIdAndProfile_User_Login(Long id, String login);

    Optional<ProgressLog> findFirstByProfileIdAndLogDateOrderByIdAsc(Long profileId, LocalDate logDate);

    List<ProgressLog> findAllByProfileIdAndLogDateGreaterThanEqualOrderByLogDateAsc(Long profileId, LocalDate from);

    /** Plans are replaced every week; logs outlive them. */
    @Modifying
    @Query("update ProgressLog log set log.plan = null where log.profile.id = :profileId and log.plan is not null")
    void detachPlansOfProfile(@Param("profileId") Long profileId);
}