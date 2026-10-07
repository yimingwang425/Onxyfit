package com.yxw1268.fyp.repository;

import com.yxw1268.fyp.domain.OtpRecord;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the OtpRecord entity.
 */
@Repository
public interface OtpRecordRepository extends JpaRepository<OtpRecord, Long> {
    Optional<OtpRecord> findFirstByEmailAndPurposeOrderByExpiryTimeDesc(String email, String purpose);

    void deleteAllByEmail(String email);

    void deleteAllByEmailAndPurpose(String email, String purpose);
}
