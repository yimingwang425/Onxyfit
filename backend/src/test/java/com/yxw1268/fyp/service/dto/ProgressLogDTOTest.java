package com.yxw1268.fyp.service.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.yxw1268.fyp.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class ProgressLogDTOTest {

    @Test
    void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(ProgressLogDTO.class);
        ProgressLogDTO progressLogDTO1 = new ProgressLogDTO();
        progressLogDTO1.setId(1L);
        ProgressLogDTO progressLogDTO2 = new ProgressLogDTO();
        assertThat(progressLogDTO1).isNotEqualTo(progressLogDTO2);
        progressLogDTO2.setId(progressLogDTO1.getId());
        assertThat(progressLogDTO1).isEqualTo(progressLogDTO2);
        progressLogDTO2.setId(2L);
        assertThat(progressLogDTO1).isNotEqualTo(progressLogDTO2);
        progressLogDTO1.setId(null);
        assertThat(progressLogDTO1).isNotEqualTo(progressLogDTO2);
    }
}
