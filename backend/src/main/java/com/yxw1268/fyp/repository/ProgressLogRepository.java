package com.yxw1268.fyp.repository;

import com.yxw1268.fyp.domain.ProgressLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
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
}