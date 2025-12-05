package com.yxw1268.fyp.repository;

import com.yxw1268.fyp.domain.ProgressLog;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the ProgressLog entity.
 */
@SuppressWarnings("unused")
@Repository
public interface ProgressLogRepository extends JpaRepository<ProgressLog, Long> {}
