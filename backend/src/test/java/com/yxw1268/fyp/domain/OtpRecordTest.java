package com.yxw1268.fyp.domain;

import static com.yxw1268.fyp.domain.OtpRecordTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.yxw1268.fyp.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class OtpRecordTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(OtpRecord.class);
        OtpRecord otpRecord1 = getOtpRecordSample1();
        OtpRecord otpRecord2 = new OtpRecord();
        assertThat(otpRecord1).isNotEqualTo(otpRecord2);

        otpRecord2.setId(otpRecord1.getId());
        assertThat(otpRecord1).isEqualTo(otpRecord2);

        otpRecord2 = getOtpRecordSample2();
        assertThat(otpRecord1).isNotEqualTo(otpRecord2);
    }
}
