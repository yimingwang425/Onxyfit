package com.yxw1268.fyp.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.ResourceAccessException;

class MlServiceWarmUpTest {

    @Test
    void pingsTheService() {
        MlServiceClient client = mock(MlServiceClient.class);
        new MlServiceWarmUp(client).wakeUp();
        verify(client).ping();
    }

    @Test
    void aFailedPingIsOnlyLogged() {
        MlServiceClient client = mock(MlServiceClient.class);
        doThrow(new ResourceAccessException("Read timed out")).when(client).ping();
        assertThatCode(() -> new MlServiceWarmUp(client).wakeUp()).doesNotThrowAnyException();
    }
}
