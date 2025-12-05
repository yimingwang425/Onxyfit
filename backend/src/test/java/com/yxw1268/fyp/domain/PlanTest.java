package com.yxw1268.fyp.domain;

import static com.yxw1268.fyp.domain.PlanTestSamples.*;
import static com.yxw1268.fyp.domain.UserProfileTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.yxw1268.fyp.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class PlanTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Plan.class);
        Plan plan1 = getPlanSample1();
        Plan plan2 = new Plan();
        assertThat(plan1).isNotEqualTo(plan2);

        plan2.setId(plan1.getId());
        assertThat(plan1).isEqualTo(plan2);

        plan2 = getPlanSample2();
        assertThat(plan1).isNotEqualTo(plan2);
    }

    @Test
    void profileTest() {
        Plan plan = getPlanRandomSampleGenerator();
        UserProfile userProfileBack = getUserProfileRandomSampleGenerator();

        plan.setProfile(userProfileBack);
        assertThat(plan.getProfile()).isEqualTo(userProfileBack);

        plan.profile(null);
        assertThat(plan.getProfile()).isNull();
    }
}
