package com.yxw1268.fyp.service;

import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Client for the Flask ML service. The service only accepts calls carrying the shared
 * internal token, so it is never called from the browser.
 */
@Service
public class MlServiceClient {

    public static final String TOKEN_HEADER = "X-Internal-Token";

    private static final Logger LOG = LoggerFactory.getLogger(MlServiceClient.class);

    private final RestTemplate predictTemplate = restTemplate(10_000, 120_000);
    private final RestTemplate insightTemplate = restTemplate(5_000, 15_000);

    private final String baseUrl;
    private final String token;

    public MlServiceClient(@Value("${app.ml-service.url}") String baseUrl, @Value("${app.ml-service.token:}") String token) {
        this.baseUrl = baseUrl;
        this.token = token;
        if (token.isBlank()) {
            LOG.warn("app.ml-service.token (ML_SERVICE_TOKEN) is not set: the ML service will reject requests");
        }
    }

    public Map<String, Object> predict(Map<String, Object> request) {
        return post(predictTemplate, "/api/predict", request);
    }

    public Map<String, Object> insight(Map<String, Object> request) {
        return post(insightTemplate, "/api/insight", request);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> post(RestTemplate template, String path, Map<String, Object> request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set(TOKEN_HEADER, token);

        ResponseEntity<Map> response = template.postForEntity(baseUrl + path, new HttpEntity<>(request, headers), Map.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new IllegalStateException("ML service returned status: " + response.getStatusCode());
        }
        return response.getBody();
    }

    private static RestTemplate restTemplate(int connectTimeoutMs, int readTimeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeoutMs);
        factory.setReadTimeout(readTimeoutMs);
        return new RestTemplate(factory);
    }
}
