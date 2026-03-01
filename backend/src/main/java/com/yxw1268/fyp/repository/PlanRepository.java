package com.yxw1268.fyp.repository;

import com.yxw1268.fyp.domain.Plan;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Plan entity.
 */
@SuppressWarnings("unused")
@Repository
public interface PlanRepository extends JpaRepository<Plan, Long> {

    void deleteAllByProfileId(Long profileId);
}