package com.yxw1268.fyp.repository;

import com.yxw1268.fyp.domain.OtpRecord;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the OtpRecord entity.
 */
@SuppressWarnings("unused")
@Repository
public interface OtpRecordRepository extends JpaRepository<OtpRecord, Long> {}
