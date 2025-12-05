package com.yxw1268.fyp.domain;

import static com.yxw1268.fyp.domain.PlanTestSamples.*;
import static com.yxw1268.fyp.domain.ProgressLogTestSamples.*;
import static com.yxw1268.fyp.domain.UserProfileTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.yxw1268.fyp.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class ProgressLogTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(ProgressLog.class);
        ProgressLog progressLog1 = getProgressLogSample1();
        ProgressLog progressLog2 = new ProgressLog();
        assertThat(progressLog1).isNotEqualTo(progressLog2);

        progressLog2.setId(progressLog1.getId());
        assertThat(progressLog1).isEqualTo(progressLog2);

        progressLog2 = getProgressLogSample2();
        assertThat(progressLog1).isNotEqualTo(progressLog2);
    }

    @Test
    void profileTest() {
        ProgressLog progressLog = getProgressLogRandomSampleGenerator();
        UserProfile userProfileBack = getUserProfileRandomSampleGenerator();

        progressLog.setProfile(userProfileBack);
        assertThat(progressLog.getProfile()).isEqualTo(userProfileBack);

        progressLog.profile(null);
        assertThat(progressLog.getProfile()).isNull();
    }

    @Test
    void planTest() {
        ProgressLog progressLog = getProgressLogRandomSampleGenerator();
        Plan planBack = getPlanRandomSampleGenerator();

        progressLog.setPlan(planBack);
        assertThat(progressLog.getPlan()).isEqualTo(planBack);

        progressLog.plan(null);
        assertThat(progressLog.getPlan()).isNull();
    }
}
