package com.yxw1268.fyp.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Wakes the ML service ahead of use. On a free hosting plan it sleeps after about 15 minutes
 * without requests, and waking it takes longer than the assistant waits for an answer. A new user
 * usually tries the app straight after registering, so registration wakes it up in the background.
 */
@Service
public class MlServiceWarmUp {

    private static final Logger LOG = LoggerFactory.getLogger(MlServiceWarmUp.class);

    private final MlServiceClient mlServiceClient;

    public MlServiceWarmUp(MlServiceClient mlServiceClient) {
        this.mlServiceClient = mlServiceClient;
    }

    @Async
    public void wakeUp() {
        try {
            mlServiceClient.ping();
            LOG.debug("ML service is awake");
        } catch (Exception e) {
            // A sleeping service still wakes up from the request even if it times out here
            LOG.warn("ML service warm-up ping failed: {}", e.getMessage());
        }
    }
}
