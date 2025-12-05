package com.yxw1268.fyp.service.mapper;

import static com.yxw1268.fyp.domain.ProgressLogAsserts.*;
import static com.yxw1268.fyp.domain.ProgressLogTestSamples.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ProgressLogMapperTest {

    private ProgressLogMapper progressLogMapper;

    @BeforeEach
    void setUp() {
        progressLogMapper = new ProgressLogMapperImpl();
    }

    @Test
    void shouldConvertToDtoAndBack() {
        var expected = getProgressLogSample1();
        var actual = progressLogMapper.toEntity(progressLogMapper.toDto(expected));
        assertProgressLogAllPropertiesEquals(expected, actual);
    }
}
