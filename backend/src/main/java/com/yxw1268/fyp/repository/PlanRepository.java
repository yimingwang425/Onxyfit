package com.yxw1268.fyp.repository;

import com.yxw1268.fyp.domain.Plan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Plan entity.
 */
@SuppressWarnings("unused")
@Repository
public interface PlanRepository extends JpaRepository<Plan, Long> {

    void deleteAllByProfileId(Long profileId);

    Page<Plan> findAllByProfile_User_Login(String login, Pageable pageable);

    boolean existsByIdAndProfile_User_Login(Long id, String login);
}